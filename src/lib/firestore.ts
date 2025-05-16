import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  doc, 
  query, 
  where, 
  orderBy, 
  Timestamp, 
  getDoc, 
  documentId,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Document } from '../store/docs';

// Referência da coleção de documentos
const getDocsCollectionRef = () => {
  return collection(db, 'documents');
};

// Criar um novo documento
export const createDocument = async (document: Omit<Document, 'id'>) => {
  // Verifica se o usuário está autenticado
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }

  try {
    // Adiciona o usuário ao documento
    const docWithUser = {
      ...document,
      userId: auth.currentUser.uid,
      createdAt: Timestamp.now()
    };

    // Adiciona o documento ao Firestore
    const docRef = await addDoc(getDocsCollectionRef(), docWithUser);
    
    // Retorna o documento com o ID gerado pelo Firestore
    return {
      id: docRef.id,
      ...document,
      createdAt: new Date()
    };
  } catch (error) {
    console.error('Erro ao criar documento:', error);
    throw error;
  }
};

// Buscar todos os documentos do usuário atual
export const fetchUserDocuments = async () => {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const q = query(
      getDocsCollectionRef(),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        content: data.content,
        summary: data.summary,
        language: data.language,
        createdAt: data.createdAt.toDate(),
        jsonData: data.jsonData
      } as Document;
    });
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    throw error;
  }
};

// Atualizar um documento existente
export const updateDocumentInFirestore = async (id: string, updates: Partial<Document>) => {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const docRef = doc(db, 'documents', id);
    
    // Verifica se o documento pertence ao usuário atual
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().userId !== auth.currentUser.uid) {
      throw new Error('Documento não encontrado ou acesso negado');
    }

    // Remove o campo id do objeto de atualizações (não queremos atualizar o ID)
    const { id: _, ...updatesWithoutId } = updates;
    
    await updateDoc(docRef, updatesWithoutId);
    return { id, ...updates };
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    throw error;
  }
};

// Excluir um documento
export const deleteDocumentFromFirestore = async (id: string) => {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const docRef = doc(db, 'documents', id);
    
    // Verifica se o documento pertence ao usuário atual
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().userId !== auth.currentUser.uid) {
      throw new Error('Documento não encontrado ou acesso negado');
    }
    
    await deleteDoc(docRef);
    return id;
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    throw error;
  }
};

// Excluir vários documentos
export const deleteMultipleDocumentsFromFirestore = async (ids: string[]) => {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }
  
  if (ids.length === 0) return;

  try {
    const batch = writeBatch(db);
    
    // Primeiro, verificamos se todos os documentos pertencem ao usuário
    const q = query(
      getDocsCollectionRef(),
      where(documentId(), 'in', ids),
      where('userId', '==', auth.currentUser.uid)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Se o número de documentos encontrados for diferente do número de IDs, alguns documentos não existem ou não pertencem ao usuário
    if (querySnapshot.docs.length !== ids.length) {
      throw new Error('Um ou mais documentos não foram encontrados ou acesso negado');
    }
    
    // Adiciona cada documento para exclusão em lote
    querySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Executa a operação em lote
    await batch.commit();
    return ids;
  } catch (error) {
    console.error('Erro ao excluir múltiplos documentos:', error);
    throw error;
  }
};

// Obter um documento específico
export const getDocumentById = async (id: string) => {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const docRef = doc(db, 'documents', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists() || docSnap.data().userId !== auth.currentUser.uid) {
      throw new Error('Documento não encontrado ou acesso negado');
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      title: data.title,
      content: data.content,
      summary: data.summary,
      language: data.language,
      createdAt: data.createdAt.toDate(),
      jsonData: data.jsonData
    } as Document;
  } catch (error) {
    console.error('Erro ao buscar documento:', error);
    throw error;
  }
}; 