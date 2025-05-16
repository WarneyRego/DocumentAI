import React, { useEffect } from 'react';
import { useDocsStore } from '../../store/docs';
import { Plus, FileText, Trash2, Code, FileJson, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { DocumentsSelectionPanel } from './DocumentsSelectionPanel';

export function Dashboard() {
  const { 
    documents, 
    deleteDocument, 
    setCurrentDocument, 
    fetchDocuments, 
    loading, 
    error,
    initialized
  } = useDocsStore();
  const { darkMode } = useTheme();

  // Inicializar busca de documentos do Firestore
  useEffect(() => {
    if (!initialized) {
      fetchDocuments();
    }
  }, [fetchDocuments, initialized]);

  // Função para limpar o documento atual antes de navegar para criar um novo
  const handleNewDocument = () => {
    setCurrentDocument(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Seus Documentos</h1>
        <Link
          to="/editor"
          onClick={handleNewDocument}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Documento
        </Link>
      </div>

      {/* Mostrar mensagem de erro, se houver */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 text-red-700 dark:text-red-400">
          <p>Erro ao carregar documentos: {error}</p>
        </div>
      )}

      {/* Mostrar loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader className="h-8 w-8 text-indigo-500 animate-spin" />
          <span className="ml-2 text-gray-600 dark:text-gray-300">Carregando documentos...</span>
        </div>
      )}

      {/* Mostrar mensagem de nenhum documento */}
      {!loading && documents.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum documento</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comece criando um novo documento.
          </p>
        </div>
      ) : (
        // Lista de documentos
        !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                className="relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors duration-200"
              >
                <Link
                  to={`/editor?id=${doc.id}`}
                  className="block p-6"
                >
                  <div className="flex items-center space-x-3">
                    {doc.jsonData ? (
                      <FileJson className="h-6 w-6 text-green-500 dark:text-green-400" />
                    ) : (
                      <Code className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
                    )}
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                      {doc.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {doc.jsonData 
                      ? 'Documento em formato JSON' 
                      : (doc.summary || 'Nenhum resumo disponível')
                    }
                  </p>
                  <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    <span className="mx-2">•</span>
                    <span className="uppercase">{doc.language}</span>
                  </div>
                </Link>
                <button
                  onClick={() => deleteDocument(doc.id)}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  title="Excluir documento"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )
      )}
      
      {/* Painel de seleção de documentos para PDF */}
      {!loading && documents.length > 0 && <DocumentsSelectionPanel />}
    </div>
  );
}