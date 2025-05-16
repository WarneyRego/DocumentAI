import React, { useState } from 'react';
import { useDocsStore, Document } from '../../store/docs';
import { FileText, FileDown, CheckSquare, Square, File, X, Trash2, BookOpen, FileDigit } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useTheme } from '../../contexts/ThemeContext';

type ContentType = 'full' | 'summary';

export function DocumentsSelectionPanel() {
  const { documents, getSelectedDocuments, deleteMultipleDocuments } = useDocsStore();
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('full');
  const { darkMode } = useTheme();

  const togglePanel = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSelectedDocs([]);
      setShowConfirmDelete(false);
    }
  };

  const toggleDocSelection = (docId: string) => {
    if (selectedDocs.includes(docId)) {
      setSelectedDocs(selectedDocs.filter(id => id !== docId));
    } else {
      setSelectedDocs([...selectedDocs, docId]);
    }
  };

  const selectAll = () => {
    if (selectedDocs.length === documents.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(documents.map(doc => doc.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedDocs.length === 0) return;
    
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (selectedDocs.length === 0) return;
    
    setIsDeleting(true);
    
    try {
      await deleteMultipleDocuments(selectedDocs);
      setSelectedDocs([]);
      setShowConfirmDelete(false);
    } catch (error) {
      console.error('Erro ao excluir documentos:', error);
      alert('Ocorreu um erro ao excluir os documentos. Por favor, tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowConfirmDelete(false);
  };

  const generatePDF = async () => {
    if (selectedDocs.length === 0) return;
    
    setIsGenerating(true);
    
    try {
      // Criar o documento PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const selectedDocuments = getSelectedDocuments(selectedDocs);
      
      // Definindo dimensões da página
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      
      // Cores mais harmoniosas
      const colors = {
        primary: [41, 128, 185] as [number, number, number],       // Azul mais suave
        lightBlue: [91, 192, 235] as [number, number, number],     // Azul claro para títulos
        secondary: [149, 165, 166] as [number, number, number],    // Cinza azulado
        accent: [39, 174, 96] as [number, number, number],         // Verde mais suave
        text: {
          dark: [0, 0, 0] as [number, number, number],             // Preto para texto principal
          light: [255, 255, 255] as [number, number, number],      // Branco
          muted: [0, 0, 0] as [number, number, number],            // Preto para texto secundário também
        },
        background: {
          light: [236, 240, 241] as [number, number, number],      // Cinza muito claro
          highlight: [241, 248, 233] as [number, number, number],  // Verde muito claro
        }
      };
      
      // Configuração de fonte e estilos
      const fonts = {
        title: { name: 'helvetica', style: 'bold', size: 16 },
        subtitle: { name: 'helvetica', style: 'bold', size: 14 },
        heading: { name: 'helvetica', style: 'bold', size: 12 },
        normal: { name: 'helvetica', style: 'normal', size: 11 },  // Aumentado para 11
        small: { name: 'helvetica', style: 'normal', size: 11 }    // Aumentado de 8 para 11
      };
      
      // Constantes de layout
      const layout = {
        header: {
          height: 25,
          titleY: 10,
          lineY: 18
        },
        footer: {
          height: 15,
          lineY: pageHeight - 15,
          textY: pageHeight - 7
        },
        content: {
          startY: 30,
          endY: pageHeight - 20,
          width: pageWidth - 2 * margin
        }
      };
      
      // Função para formatar texto
      const formatText = (text: string): string => {
        // Remover símbolos # de títulos markdown e preservar o texto
        let formattedText = text.replace(/^#{1,6}\s+/gm, '');
        
        // Remover símbolos # em hashtags e preservar o texto
        formattedText = formattedText.replace(/#(\w+)/g, '$1');
        
        // Limpar espaços extras
        formattedText = formattedText.replace(/\n{3,}/g, '\n\n');
        
        return formattedText;
      };
      
      // Função para adicionar cabeçalho
      const addHeader = (pageNum: number, totalPages: number, docTitle?: string) => {
        // Fundo do cabeçalho
        pdf.setFillColor(colors.background.light[0], colors.background.light[1], colors.background.light[2]);
        pdf.rect(0, 0, pageWidth, layout.header.height, 'F');
        
        // Título ou nome do documento
        const title = docTitle || 'DOCUMENTAÇÃO';
        pdf.setFont(fonts.heading.name, fonts.heading.style);
        pdf.setFontSize(fonts.heading.size);
        pdf.setTextColor(colors.lightBlue[0], colors.lightBlue[1], colors.lightBlue[2]);
        pdf.text(title, margin, layout.header.titleY);
        
        // Número da página
        pdf.setFont(fonts.normal.name, fonts.normal.style);
        pdf.setFontSize(fonts.normal.size);
        pdf.setTextColor(colors.text.dark[0], colors.text.dark[1], colors.text.dark[2]);
        pdf.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, layout.header.titleY, { align: 'right' });
      };
      
      // Função para adicionar rodapé
      const addFooter = () => {
        // Fundo do rodapé
        pdf.setFillColor(colors.background.light[0], colors.background.light[1], colors.background.light[2]);
        pdf.rect(0, pageHeight - layout.footer.height, pageWidth, layout.footer.height, 'F');
        
        // Data e hora
        const currentDate = new Date().toLocaleDateString();
        pdf.setFont(fonts.normal.name, fonts.normal.style);
        pdf.setFontSize(fonts.normal.size);
        pdf.setTextColor(colors.text.dark[0], colors.text.dark[1], colors.text.dark[2]);
        pdf.text(`Gerado em: ${currentDate}`, margin, layout.footer.textY);
        
        // Texto direita
        pdf.text('Sistema de Documentação', pageWidth - margin, layout.footer.textY, { align: 'right' });
      };
      
      // Contador de páginas para numeração
      let currentPage = 1;
      let totalPages = 1; // Será atualizado durante a criação
      
      // Primeira página com capa
      if (selectedDocuments.length > 0) {
        // Adicionar elementos de página
        addHeader(currentPage, totalPages);
        addFooter();
        
        // Título principal centralizado
        const title = "Documentação do Projeto";
        pdf.setFont(fonts.title.name, fonts.title.style);
        pdf.setFontSize(fonts.title.size + 4);
        pdf.setTextColor(colors.lightBlue[0], colors.lightBlue[1], colors.lightBlue[2]);
        pdf.text(title, pageWidth / 2, 60, { align: 'center' });
        
        // Subtítulo
        pdf.setFont(fonts.subtitle.name, fonts.subtitle.style);
        pdf.setFontSize(fonts.subtitle.size);
        pdf.setTextColor(colors.text.dark[0], colors.text.dark[1], colors.text.dark[2]);
        pdf.text(`Coleção de ${selectedDocuments.length} documento${selectedDocuments.length > 1 ? 's' : ''}`, 
                pageWidth / 2, 75, { align: 'center' });
        
        // Data
        const dateStr = new Date().toLocaleDateString();
        pdf.setFont(fonts.normal.name, fonts.normal.style);
        pdf.setFontSize(fonts.normal.size);
        pdf.setTextColor(colors.text.dark[0], colors.text.dark[1], colors.text.dark[2]);
        pdf.text(`Gerado em ${dateStr}`, pageWidth / 2, 85, { align: 'center' });
        
        // Informações dos documentos
        const startY = 110;
        let yPos = startY;
        
        // Título da lista
        pdf.setFont(fonts.heading.name, fonts.heading.style);
        pdf.setFontSize(fonts.heading.size);
        pdf.setTextColor(colors.lightBlue[0], colors.lightBlue[1], colors.lightBlue[2]);
        pdf.text("Documentos incluídos:", margin, yPos);
        yPos += 10;
        
        // Lista de documentos
        pdf.setFont(fonts.normal.name, fonts.normal.style);
        pdf.setFontSize(fonts.normal.size);
        
        for (let i = 0; i < selectedDocuments.length; i++) {
          const doc = selectedDocuments[i];
          
          // Texto do documento
          pdf.setTextColor(colors.text.dark[0], colors.text.dark[1], colors.text.dark[2]);
          const docLine = `${doc.title} ${doc.language}`;
          pdf.text(docLine, margin + 8, yPos);
          
          yPos += 8;
          
          // Verificar se precisa de uma nova página
          if (yPos > pageHeight - 30 && i < selectedDocuments.length - 1) {
            pdf.addPage();
            currentPage++;
            totalPages++;
            
            addHeader(currentPage, totalPages);
            addFooter();
            
            yPos = startY;
          }
        }
        
        // Informação sobre o tipo de conteúdo
        yPos += 15;
        pdf.setFont(fonts.normal.name, fonts.normal.style);
        pdf.setFontSize(fonts.normal.size);
        pdf.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
        pdf.text(`Tipo de conteúdo: ${contentType === 'summary' ? 'Resumo' : 'Completo'}`, margin, yPos + 1);
      }
      
      // Criar páginas para cada documento selecionado
      let currentDoc = 0;
      let yPosition = layout.content.startY + 20;
      let isFirstDocOnPage = true;
      
      while (currentDoc < selectedDocuments.length) {
        const doc = selectedDocuments[currentDoc];
        currentDoc++;
        
        // Calcular espaço aproximado necessário para o documento atual
        // Estimativa básica: título (12px) + metadados (12px) + estimativa de conteúdo
        const contentEstimate = contentType === 'summary' && doc.summary 
          ? Math.min(doc.summary.length / 4, 100) 
          : Math.min(doc.content.length / 4, 150);
        const spaceNeeded = 50 + contentEstimate; // 50px para cabeçalhos + estimativa do conteúdo
        
        // Se não for o primeiro documento e não tiver espaço suficiente, criar nova página
        if (!isFirstDocOnPage && yPosition + spaceNeeded > layout.content.endY - 20) {
          pdf.addPage();
          currentPage++;
          totalPages++;
          
          // Adicionar elementos de página
          addHeader(currentPage, totalPages, "Documentação");
          addFooter();
          
          // Área para o conteúdo do documento com um fundo suave
          pdf.setFillColor(255, 255, 255); // Fundo branco para o corpo principal
          pdf.rect(margin - 5, layout.content.startY, layout.content.width + 10, 
                  layout.content.endY - layout.content.startY, 'F');
          
          // Resetar a posição vertical para o início da área de conteúdo
          yPosition = layout.content.startY + 20;
          isFirstDocOnPage = true;
        } 
        // Se for o primeiro documento na página ou houver espaço
        else if (!isFirstDocOnPage) {
          // Adicionar separador entre documentos
          pdf.setDrawColor(colors.lightBlue[0], colors.lightBlue[1], colors.lightBlue[2]);
          pdf.setLineWidth(0.5);
          pdf.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 15;
        } 
        // Se for o primeiro documento e primeiro na lista, criar nova página
        else if (isFirstDocOnPage && currentDoc === 1) {
          pdf.addPage();
          currentPage++;
          totalPages++;
          
          // Adicionar elementos de página
          addHeader(currentPage, totalPages, "Documentação");
          addFooter();
          
          // Área para o conteúdo do documento com um fundo suave
          pdf.setFillColor(255, 255, 255); // Fundo branco para o corpo principal
          pdf.rect(margin - 5, layout.content.startY, layout.content.width + 10, 
                  layout.content.endY - layout.content.startY, 'F');
        }
        
        // Barra de informações com metadados
        pdf.setFillColor(colors.background.highlight[0], colors.background.highlight[1], colors.background.highlight[2]);
        pdf.rect(margin - 5, yPosition - 10, layout.content.width + 10, 12, 'F');
        
        // Adicionar linguagem em destaque
        pdf.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
        pdf.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
        
        const langText = doc.language;
        const langWidth = pdf.getTextWidth(langText) + 10;
        pdf.roundedRect(pageWidth - margin - langWidth, yPosition - 8, langWidth, 8, 2, 2, 'FD');
        
        pdf.setFont(fonts.normal.name, 'bold');
        pdf.setFontSize(fonts.normal.size);
        pdf.setTextColor(255, 255, 255);
        pdf.text(langText, pageWidth - margin - langWidth/2, yPosition - 3, { align: 'center' });
        
        // Título do documento
        pdf.setFont(fonts.heading.name, fonts.heading.style);
        pdf.setFontSize(fonts.heading.size);
        pdf.setTextColor(colors.text.dark[0], colors.text.dark[1], colors.text.dark[2]);
        pdf.text(doc.title, margin, yPosition - 3);
        
        // Data e informações do documento
        pdf.setFont(fonts.normal.name, fonts.normal.style);
        pdf.setFontSize(fonts.normal.size);
        pdf.setTextColor(colors.text.dark[0], colors.text.dark[1], colors.text.dark[2]);
        const dateText = `Criado ${new Date(doc.createdAt).toLocaleDateString()}`;
        pdf.text(dateText, margin + pdf.getTextWidth(doc.title) + 10, yPosition - 3);
        
        // Avançar a posição vertical
        yPosition += 10;
        
        // Variável para armazenar o conteúdo (completo ou resumo)
        let rawContent: string;
        
        // Adicionar indicador de conteúdo
        if (contentType === 'summary' && doc.summary) {
          pdf.setFillColor(colors.background.light[0], colors.background.light[1], colors.background.light[2]);
          pdf.roundedRect(margin, yPosition - 5, 60, 10, 2, 2, 'F');
          
          pdf.setFont(fonts.normal.name, 'bold');
          pdf.setFontSize(fonts.normal.size);
          pdf.setTextColor(colors.lightBlue[0], colors.lightBlue[1], colors.lightBlue[2]);
          pdf.text('RESUMO DO DOCUMENTO', margin + 5, yPosition + 1);
          
          yPosition += 10;
          rawContent = doc.summary;
        } else {
          pdf.setFillColor(colors.background.light[0], colors.background.light[1], colors.background.light[2]);
          pdf.roundedRect(margin, yPosition - 5, 85, 10, 2, 2, 'F');
          
          pdf.setFont(fonts.normal.name, 'bold');
          pdf.setFontSize(fonts.normal.size);
          pdf.setTextColor(colors.lightBlue[0], colors.lightBlue[1], colors.lightBlue[2]);
          pdf.text('CONTEÚDO COMPLETO DO DOCUMENTO', margin + 5, yPosition + 1);
          
          yPosition += 10;
          rawContent = doc.content;
        }
        
        // Processar o conteúdo formatado
        const formattedContent = formatText(rawContent);
        const lines = formattedContent.split('\n');
        
        // Configurar fonte padrão para o conteúdo
        pdf.setFont(fonts.normal.name, fonts.normal.style);
        pdf.setFontSize(fonts.normal.size);
        pdf.setTextColor(colors.text.dark[0], colors.text.dark[1], colors.text.dark[2]);
        
        // Adicionar conteúdo linha por linha com formatação aprimorada
        for (let j = 0; j < lines.length; j++) {
          const line = lines[j].trim();
          
          if (line.length === 0) {
            // Espaço para parágrafos
            yPosition += 4;
            continue;
          }
          
          // Detectar se parece um título ou cabeçalho
          if (line.length < 60 && (line.endsWith(':') || line.toUpperCase() === line || !line.includes(' '))) {
            // Formatar como cabeçalho
            pdf.setFont(fonts.heading.name, fonts.heading.style);
            pdf.setFontSize(fonts.heading.size);
            pdf.setTextColor(colors.lightBlue[0], colors.lightBlue[1], colors.lightBlue[2]);
            
            // Adicionar um pequeno espaço antes de cabeçalhos
            yPosition += 3;
            
            const wrappedText = pdf.splitTextToSize(line, layout.content.width - 10);
            pdf.text(wrappedText, margin, yPosition);
            yPosition += wrappedText.length * 6;
            
            // Voltar para o estilo normal
            pdf.setFont(fonts.normal.name, fonts.normal.style);
            pdf.setFontSize(fonts.normal.size);
            pdf.setTextColor(colors.text.dark[0], colors.text.dark[1], colors.text.dark[2]);
          } else {
            // Texto normal com quebra automática
            const wrappedText = pdf.splitTextToSize(line, layout.content.width - 10);
            pdf.text(wrappedText, margin, yPosition);
            yPosition += wrappedText.length * 5;
          }
          
          // Verificar se atingiu o final da página
          if (yPosition > layout.content.endY - 5) {
            pdf.addPage();
            currentPage++;
            totalPages++;
            
            // Adicionar elementos da página
            addHeader(currentPage, totalPages, doc.title);
            addFooter();
            
            // Resetar o posicionamento de conteúdo
            yPosition = layout.content.startY + 5;
            
            // Adicionar caixa de conteúdo
            pdf.setFillColor(255, 255, 255);
            pdf.rect(margin - 5, layout.content.startY, layout.content.width + 10, 
                    layout.content.endY - layout.content.startY, 'F');
            
            // Indicador de continuação
            pdf.setFont(fonts.normal.name, 'italic');
            pdf.setFontSize(fonts.normal.size);
            pdf.setTextColor(colors.text.dark[0], colors.text.dark[1], colors.text.dark[2]);
            pdf.text('continuação', margin, yPosition);
            yPosition += 8;
          }
        }
        
        // Agora que terminamos de processar este documento, o próximo não será o primeiro na página
        isFirstDocOnPage = false;
      }
      
      // Atualizar o total de páginas em todas as páginas
      for (let i = 0; i < currentPage; i++) {
        pdf.setPage(i + 1);
        
        // Recriar o cabeçalho com o número total correto de páginas
        const pageNumber = i + 1;
        let docTitle = "DOCUMENTAÇÃO";
        
        // Para páginas de documentos, usar o título do documento correspondente
        if (i > 0 && i - 1 < selectedDocuments.length) {
          docTitle = selectedDocuments[i - 1].title;
        }
        
        // Limpar área do cabeçalho
        pdf.setFillColor(colors.background.light[0], colors.background.light[1], colors.background.light[2]);
        pdf.rect(0, 0, pageWidth, layout.header.height, 'F');
        
        // Redesenhar o cabeçalho com o total correto
        addHeader(pageNumber, totalPages, (i > 0) ? docTitle : undefined);
      }
      
      // Nome do arquivo com data
      const date = new Date().toLocaleDateString().replace(/\//g, '-');
      const fileName = `documentacao-${date}.pdf`;
      
      // Salvar o PDF
      pdf.save(fileName);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={togglePanel}
        className={`fixed bottom-6 right-6 p-3 rounded-full shadow-lg z-50 ${
          darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'
        } text-white transition-all duration-200`}
        title="Selecionar documentos para exportar"
      >
        <FileText className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 w-80 rounded-lg shadow-xl z-50 ${
      darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    }`}>
      <div className={`p-4 flex justify-between items-center ${
        darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'
      }`}>
        <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Exportar Documentos
        </h3>
        <button 
          onClick={togglePanel}
          className={`p-1 rounded-full ${
            darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          }`}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-4">
        {showConfirmDelete ? (
          <div className={`p-4 rounded-md ${darkMode ? 'bg-red-900/20' : 'bg-red-50'} mb-4`}>
            <p className={`text-sm font-medium mb-4 ${darkMode ? 'text-red-300' : 'text-red-800'}`}>
              Tem certeza que deseja excluir {selectedDocs.length} {selectedDocs.length === 1 ? 'documento' : 'documentos'}?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${
                  darkMode 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                } flex justify-center items-center`}
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Excluindo...
                  </>
                ) : (
                  <>Confirmar</>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between mb-4">
              <button 
                onClick={selectAll}
                className={`flex items-center text-sm ${
                  darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'
                }`}
              >
                {selectedDocs.length === documents.length ? (
                  <>
                    <CheckSquare className="h-4 w-4 mr-1" />
                    Desmarcar todos
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4 mr-1" />
                    Selecionar todos
                  </>
                )}
              </button>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {selectedDocs.length} de {documents.length}
              </span>
            </div>
            
            <div className={`max-h-60 overflow-y-auto mb-4 ${
              darkMode ? 'scrollbar-dark' : 'scrollbar-light'
            }`}>
              {documents.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Nenhum documento disponível
                </p>
              ) : (
                <ul className="space-y-2">
                  {documents.map((doc) => (
                    <li 
                      key={doc.id}
                      className={`p-2 rounded flex items-center cursor-pointer ${
                        selectedDocs.includes(doc.id)
                          ? (darkMode ? 'bg-gray-700' : 'bg-indigo-50')
                          : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50')
                      }`}
                      onClick={() => toggleDocSelection(doc.id)}
                    >
                      <div className="mr-2">
                        {selectedDocs.includes(doc.id) ? (
                          <CheckSquare className={`h-5 w-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        ) : (
                          <Square className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {doc.title}
                        </p>
                        <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(doc.createdAt).toLocaleDateString()} • {doc.language}
                        </p>
                      </div>
                      <File className={`h-4 w-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* Seleção de tipo de conteúdo */}
            <div className={`mb-4 p-3 rounded-md ${
              darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
            }`}>
              <p className={`text-sm font-medium mb-2 ${
                darkMode ? 'text-white' : 'text-gray-700'
              }`}>
                Tipo de conteúdo:
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setContentType('full')}
                  className={`flex items-center justify-center py-2 px-3 rounded text-sm flex-1 ${
                    contentType === 'full'
                      ? (darkMode 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-indigo-500 text-white')
                      : (darkMode 
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300')
                  }`}
                >
                  <FileDigit className="h-4 w-4 mr-1" />
                  Completo
                </button>
                <button
                  onClick={() => setContentType('summary')}
                  className={`flex items-center justify-center py-2 px-3 rounded text-sm flex-1 ${
                    contentType === 'summary'
                      ? (darkMode 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-indigo-500 text-white')
                      : (darkMode 
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300')
                  }`}
                >
                  <BookOpen className="h-4 w-4 mr-1" />
                  Resumo
                </button>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={generatePDF}
                disabled={selectedDocs.length === 0 || isGenerating}
                className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center ${
                  selectedDocs.length === 0 || isGenerating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                    : (darkMode 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                        : 'bg-indigo-500 hover:bg-indigo-600 text-white')
                }`}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4 mr-1" />
                    Exportar PDF
                  </>
                )}
              </button>
              
              <button
                onClick={handleDeleteSelected}
                disabled={selectedDocs.length === 0}
                className={`py-2 px-3 rounded-md flex items-center justify-center ${
                  selectedDocs.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                    : (darkMode 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-red-600 hover:bg-red-700 text-white')
                }`}
                title="Excluir selecionados"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 