import React, { useState, useRef, useEffect } from 'react';
import { languages, Language } from '../../lib/languages';
import { Search, X } from 'lucide-react';

interface LanguageSelectorProps {
  onSelect: (language: Language) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function LanguageSelector({ onSelect, onClose, isOpen }: LanguageSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLanguages, setFilteredLanguages] = useState(languages);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = languages.filter((lang: Language) => 
        lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lang.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLanguages(filtered);
      setHighlightedIndex(0);
    } else {
      setFilteredLanguages(languages);
      setHighlightedIndex(0);
    }
  }, [searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredLanguages.length - 1 ? prev + 1 : prev
      );
      scrollToHighlighted();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
      scrollToHighlighted();
    } else if (e.key === 'Enter' && filteredLanguages.length > 0) {
      e.preventDefault();
      onSelect(filteredLanguages[highlightedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const scrollToHighlighted = () => {
    setTimeout(() => {
      const highlighted = document.getElementById(`language-option-${highlightedIndex}`);
      if (highlighted && listRef.current) {
        const container = listRef.current;
        const scrollTop = container.scrollTop;
        const offsetTop = highlighted.offsetTop;
        const offsetHeight = highlighted.offsetHeight;
        
        if (offsetTop < scrollTop) {
          container.scrollTop = offsetTop;
        } else if (offsetTop + offsetHeight > scrollTop + container.offsetHeight) {
          container.scrollTop = offsetTop + offsetHeight - container.offsetHeight;
        }
      }
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-4" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Selecionar Idioma</h3>
          <div className="flex items-center">
            <span className="text-sm text-green-600 mr-2">Tradução gratuita</span>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar idioma..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div 
          ref={listRef}
          className="max-h-60 overflow-y-auto"
        >
          {filteredLanguages.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Nenhum idioma encontrado
            </div>
          ) : (
            filteredLanguages.map((language: Language, index: number) => (
              <div
                id={`language-option-${index}`}
                key={language.code}
                className={`flex items-center p-2 cursor-pointer rounded-md ${
                  index === highlightedIndex ? 'bg-indigo-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => onSelect(language)}
              >
                <span className="text-xl mr-3">{language.flag}</span>
                <span className="font-medium">{language.name}</span>
                <span className="ml-2 text-sm text-gray-500">{language.code}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 