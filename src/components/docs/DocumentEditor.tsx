import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDocsStore, Document } from '../../store/docs';
import { useTokenStore } from '../../store/tokens';
import { generateDocumentation, reviewDocumentation, translateDocumentation, generateSummary } from '../../lib/gemini';
import { Upload, Languages, RefreshCw, Globe, Coins, Loader, FileDigit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LanguageSelector } from '../ui/LanguageSelector';
import { Language } from '../../lib/languages';
import { useTheme } from '../../contexts/ThemeContext';
import { getDocumentById } from '../../lib/firestore';

export function DocumentEditor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const { 
    addDocument, 
    currentDocument, 
    updateDocument, 
    setCurrentDocument, 
    documents, 
    loading, 
    error,
    initialized,
    fetchDocuments
  } = useDocsStore();
  const { tokens, useToken } = useTokenStore();
  const [searchParams] = useSearchParams();
  const [isLanguageSelectorOpen, setIsLanguageSelectorOpen] = useState(false);
  const [isShowingSummary, setIsShowingSummary] = useState(false);
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  // Inicializar busca de documentos do Firestore se ainda não foi feito
  useEffect(() => {
    if (!initialized) {
      fetchDocuments();
    }
  }, [fetchDocuments, initialized]);

  // Recuperar o documento baseado no ID da URL
  useEffect(() => {
    const docId = searchParams.get('id');
    if (docId) {
      // Primeiro verificamos no estado local
      const doc = documents.find(d => d.id === docId);
      if (doc) {
        setCurrentDocument(doc);
      } else if (initialized && !loading) {
        // Se não encontrado localmente e já inicializamos, tentamos buscar diretamente do Firestore
        const fetchSingleDoc = async () => {
          try {
            setIsProcessing(true);
            const doc = await getDocumentById(docId);
            if (doc) {
              setCurrentDocument(doc);
            } else {
              // Se não encontrado, voltamos para o Dashboard
              navigate('/');
            }
          } catch (error) {
            console.error('Erro ao buscar documento:', error);
            navigate('/');
          } finally {
            setIsProcessing(false);
          }
        };
        
        fetchSingleDoc();
      }
    }
  }, [searchParams, documents, setCurrentDocument, initialized, loading, navigate]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const supportedTypes = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!supportedTypes.includes(fileExtension)) {
      alert('Tipo de arquivo não suportado. Por favor, use arquivos .js, .jsx, .ts, .tsx, .py ou .java.');
      return;
    }

    // Detecta automaticamente a linguagem baseada na extensão do arquivo
    let detectedLanguage = '';
    switch (fileExtension) {
      case '.js':
      case '.jsx':
        detectedLanguage = 'javascript';
        break;
      case '.ts':
      case '.tsx':
        detectedLanguage = 'typescript';
        break;
      case '.py':
        detectedLanguage = 'python';
        break;
      case '.java':
        detectedLanguage = 'java';
        break;
      default:
        detectedLanguage = 'javascript'; // Padrão
    }
    
    // Atualiza o estado da linguagem selecionada
    setSelectedLanguage(detectedLanguage);

    if (!useToken()) {
      alert('Você precisa de tokens para gerar documentação. Por favor, compre mais tokens na página de preços.');
      return;
    }

    setIsProcessing(true);
    try {
      const text = await file.text();
      // Usa a linguagem detectada automaticamente
      const documentation = await generateDocumentation(text, detectedLanguage);
      
      // Tentar analisar a documentação como JSON se tiver formato de JSON
      let jsonData = null;
      let processedContent = documentation;
      
      if (typeof documentation === 'string' && (documentation.trim().startsWith('{') || documentation.trim().startsWith('['))) {
        try {
          jsonData = JSON.parse(documentation);
          // Se tivermos dados em JSON formatados como string, exibimos em formato mais legível
          processedContent = typeof jsonData === 'object' ? JSON.stringify(jsonData, null, 2) : documentation;
        } catch (e) {
          console.error('Erro ao analisar JSON:', e);
        }
      }
      
      const summary = await generateSummary(processedContent);

      // Agora criamos o documento sem ID, pois o Firestore vai gerar um
      await addDocument({
        title: file.name,
        content: processedContent,
        summary,
        language: detectedLanguage, // Usa a linguagem detectada
        createdAt: new Date(),
        jsonData: jsonData
      });
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      alert('Erro ao processar arquivo. Por favor, tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  }, [addDocument, useToken]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleReview = async () => {
    if (!currentDocument) return;
    
    if (!useToken()) {
      alert('Você precisa de tokens para revisar documentação. Por favor, compre mais tokens na página de preços.');
      return;
    }

    setIsProcessing(true);
    try {
      const reviewed = await reviewDocumentation(currentDocument.content);
      
      // Tentar analisar como JSON se for o caso
      let jsonData = null;
      let processedContent = reviewed;
      
      if (typeof reviewed === 'string' && (reviewed.trim().startsWith('{') || reviewed.trim().startsWith('['))) {
        try {
          jsonData = JSON.parse(reviewed);
          processedContent = typeof jsonData === 'object' ? JSON.stringify(jsonData, null, 2) : reviewed;
        } catch (e) {
          console.error('Erro ao analisar JSON:', e);
        }
      }
      
      await updateDocument(currentDocument.id, { 
        content: processedContent,
        jsonData: jsonData 
      });
    } catch (error) {
      console.error('Erro ao revisar documento:', error);
      alert('Erro ao revisar documento. Por favor, tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTranslate = async (language: Language) => {
    if (!currentDocument) return;
    
    setIsProcessing(true);
    try {
      const translated = await translateDocumentation(currentDocument.content, language.name);
      
      // Tentar analisar como JSON se for o caso
      let jsonData = null;
      let processedContent = translated;
      
      if (typeof translated === 'string' && (translated.trim().startsWith('{') || translated.trim().startsWith('['))) {
        try {
          jsonData = JSON.parse(translated);
          processedContent = typeof jsonData === 'object' ? JSON.stringify(jsonData, null, 2) : translated;
        } catch (e) {
          console.error('Erro ao analisar JSON:', e);
        }
      }
      
      await updateDocument(currentDocument.id, { 
        content: processedContent,
        jsonData: jsonData 
      });
    } catch (error) {
      console.error('Erro ao traduzir documento:', error);
      alert('Erro ao traduzir documento. Por favor, tente novamente.');
    } finally {
      setIsProcessing(false);
      setIsLanguageSelectorOpen(false);
    }
  };

  const handleSummarize = async () => {
    if (!currentDocument) return;
    
    if (!useToken()) {
      alert('Você precisa de tokens para resumir documentação. Por favor, compre mais tokens na página de preços.');
      return;
    }
    
    setIsProcessing(true);
    try {
      // Se já temos um resumo, apenas alternamos a visualização
      if (currentDocument.summary && currentDocument.summary.length > 0) {
        setIsShowingSummary(!isShowingSummary);
        setIsProcessing(false);
        return;
      }
      
      // Caso contrário, geramos um novo resumo
      const summarized = await generateSummary(currentDocument.content);
      
      // Salvamos o resumo no documento
      await updateDocument(currentDocument.id, { 
        summary: summarized
      });
      
      // Exibimos o resumo
      setIsShowingSummary(true);
    } catch (error) {
      console.error('Erro ao resumir documentação:', error);
      alert('Erro ao resumir documento. Por favor, tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Editor de Documentos</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-indigo-600">
            <Coins className="h-5 w-5" />
            <span className="font-medium">{tokens} tokens restantes</span>
          </div>
          <button
            onClick={handleReview}
            disabled={isProcessing || !currentDocument}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
            Revisar (1 token)
          </button>
          <button
            onClick={handleSummarize}
            disabled={isProcessing || !currentDocument}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isShowingSummary ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-500 hover:bg-amber-600'} disabled:opacity-50`}
          >
            <FileDigit className="h-4 w-4 mr-2" />
            {isShowingSummary ? 'Ver Completo' : 'Resumir'}
          </button>
          <button
            onClick={() => setIsLanguageSelectorOpen(true)}
            disabled={isProcessing || !currentDocument}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            <Globe className="h-4 w-4 mr-2" />
            Traduzir
          </button>
        </div>
      </div>

      {/* Mostrar mensagem de erro, se houver */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 text-red-700 dark:text-red-400">
          <p>Erro ao carregar documentos: {error}</p>
        </div>
      )}

      {/* Mostrar loading global */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader className="h-8 w-8 text-indigo-500 animate-spin" />
          <span className="ml-2 text-gray-600 dark:text-gray-300">Carregando documentos...</span>
        </div>
      )}

      {!currentDocument && !loading ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center ${
            isDragActive 
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
              : 'border-gray-300 dark:border-gray-700'
          } dark:bg-gray-800`}
        >
          <input {...getInputProps()} />
          {isProcessing ? (
            <div className="text-center">
              <Loader className="mx-auto h-12 w-12 text-indigo-500 animate-spin" />
              <p className="mt-2 text-sm font-medium text-gray-900">Processando arquivo...</p>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-900">
                {isDragActive
                  ? 'Solte o arquivo aqui...'
                  : 'Arraste e solte um arquivo, ou clique para selecionar (1 token)'}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Suporta arquivos .js, .ts, .py e .java
              </p>
            </>
          )}
        </div>
      ) : !loading && currentDocument ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center justify-between">
              <span>{currentDocument.title}</span>
              <div className="flex items-center">
                {isShowingSummary && (
                  <span className="mr-3 text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                    Visualizando Resumo
                  </span>
                )}
                {isProcessing && (
                  <Loader className="h-5 w-5 text-indigo-500 animate-spin" />
                )}
              </div>
            </h2>
            <div className="mt-4 border-t pt-4">
              {currentDocument.jsonData ? (
                // Visualização melhorada para dados JSON
                <div className="documentation-container">
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-t-lg border border-indigo-100">
                    <h3 className="text-lg font-medium text-indigo-700 mb-2">Documentação Gerada</h3>
                    <div className="text-sm text-gray-500">
                      Idioma: <span className="font-semibold text-indigo-600">{currentDocument.language}</span> • 
                      Gerado em: <span className="font-semibold text-indigo-600">{new Date(currentDocument.createdAt).toLocaleDateString()} {new Date(currentDocument.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="border border-t-0 border-gray-200 rounded-b-lg overflow-hidden">
                    <pre className="bg-gray-50 p-4 overflow-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-gray-100">
                      <code className="text-sm whitespace-pre-wrap break-words">
                        {JSON.stringify(currentDocument.jsonData, null, 2)
                          .replace(/[{]/g, '<span class="text-blue-600">{</span>')
                          .replace(/[}]/g, '<span class="text-blue-600">}</span>')
                          .replace(/["]\w+["]/g, match => `<span class="text-purple-600">${match}</span>`)
                          .replace(/: (true|false|\d+)/g, match => `: <span class="text-green-600">${match.substring(2)}</span>`)}
                      </code>
                    </pre>
                  </div>
                </div>
              ) : (
                // Visualização melhorada para Markdown
                <div className="documentation-container">
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-t-lg border border-indigo-100">
                    <h3 className="text-lg font-medium text-indigo-700 mb-2">
                      {isShowingSummary ? 'Resumo da Documentação' : 'Documentação Completa'}
                    </h3>
                    <div className="text-sm text-gray-500">
                      Idioma: <span className="font-semibold text-indigo-600">{currentDocument.language}</span> • 
                      Gerado em: <span className="font-semibold text-indigo-600">
                        {new Date(currentDocument.createdAt).toLocaleDateString()} 
                        {new Date(currentDocument.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className="border border-t-0 border-gray-200 rounded-b-lg p-6 bg-white">
                    <div className="prose prose-indigo max-w-none prose-headings:text-indigo-700 prose-h1:border-b prose-h1:pb-2 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-a:text-blue-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm">
                      <ReactMarkdown>
                        {isShowingSummary 
                          ? currentDocument.summary 
                          : currentDocument.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Language Selector Modal */}
      <LanguageSelector 
        isOpen={isLanguageSelectorOpen}
        onClose={() => setIsLanguageSelectorOpen(false)}
        onSelect={handleTranslate}
      />
    </div>
  );
}