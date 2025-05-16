import { create } from 'zustand';
import { 
  createDocument, 
  fetchUserDocuments, 
  updateDocumentInFirestore, 
  deleteDocumentFromFirestore, 
  deleteMultipleDocumentsFromFirestore,
  getDocumentById
} from '../lib/firestore';

export interface Document {
  id: string;
  title: string;
  content: string;
  summary: string;
  language: string;
  createdAt: Date;
  jsonData?: Record<string, any>; // Campo opcional para armazenar a resposta JSON original
}

interface DocsState {
  documents: Document[];
  currentDocument: Document | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  addDocument: (doc: Omit<Document, 'id'>) => Promise<void>;
  fetchDocuments: () => Promise<void>;
  setCurrentDocument: (doc: Document | null) => void;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  deleteMultipleDocuments: (ids: string[]) => Promise<void>;
  getSelectedDocuments: (ids: string[]) => Document[];
}

export const useDocsStore = create<DocsState>()((set, get) => ({
  documents: [],
  currentDocument: null,
  loading: false,
  error: null,
  initialized: false,

  // Inicializar documentos do Firestore
  fetchDocuments: async () => {
    set({ loading: true, error: null });
    try {
      const docs = await fetchUserDocuments();
      set({ documents: docs, loading: false, initialized: true });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao buscar documentos',
        loading: false,
        initialized: true 
      });
    }
  },

  // Adicionar um novo documento
  addDocument: async (doc) => {
    set({ loading: true, error: null });
    try {
      const newDoc = await createDocument(doc);
      set((state) => ({ 
        documents: [newDoc, ...state.documents],
        currentDocument: newDoc,
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao adicionar documento',
        loading: false 
      });
    }
  },

  // Definir documento atual
  setCurrentDocument: (doc) => set({ currentDocument: doc }),

  // Atualizar um documento
  updateDocument: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      await updateDocumentInFirestore(id, updates);
      
      set((state) => {
        const updatedDocs = state.documents.map(doc => 
          doc.id === id ? { ...doc, ...updates } : doc
        );
        
        // Atualizar também o documento atual se for o mesmo que está sendo editado
        const currentDoc = state.currentDocument && state.currentDocument.id === id
          ? { ...state.currentDocument, ...updates }
          : state.currentDocument;
          
        return {
          documents: updatedDocs,
          currentDocument: currentDoc,
          loading: false
        };
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao atualizar documento',
        loading: false 
      });
    }
  },

  // Excluir um documento
  deleteDocument: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDocumentFromFirestore(id);
      
      set((state) => ({
        documents: state.documents.filter(doc => doc.id !== id),
        currentDocument: state.currentDocument?.id === id ? null : state.currentDocument,
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao excluir documento',
        loading: false 
      });
    }
  },

  // Excluir vários documentos
  deleteMultipleDocuments: async (ids) => {
    if (ids.length === 0) return;
    
    set({ loading: true, error: null });
    try {
      await deleteMultipleDocumentsFromFirestore(ids);
      
      set((state) => ({
        documents: state.documents.filter(doc => !ids.includes(doc.id)),
        currentDocument: state.currentDocument && ids.includes(state.currentDocument.id) 
          ? null 
          : state.currentDocument,
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao excluir documentos',
        loading: false 
      });
    }
  },

  // Obter documentos selecionados
  getSelectedDocuments: (ids) => {
    const { documents } = get();
    return documents.filter(doc => ids.includes(doc.id));
  }
}));