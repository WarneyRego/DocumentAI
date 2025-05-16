export interface Language {
  name: string;
  code: string;
  flag: string;
}

export const languages: Language[] = [
  { name: 'Inglês', code: 'en', flag: '🇬🇧' },
  { name: 'Espanhol', code: 'es', flag: '🇪🇸' },
  { name: 'Francês', code: 'fr', flag: '🇫🇷' },
  { name: 'Alemão', code: 'de', flag: '🇩🇪' },
  { name: 'Italiano', code: 'it', flag: '🇮🇹' },
  { name: 'Português', code: 'pt', flag: '🇧🇷' },
  { name: 'Russo', code: 'ru', flag: '🇷🇺' },
  { name: 'Japonês', code: 'ja', flag: '🇯🇵' },
  { name: 'Chinês', code: 'zh', flag: '🇨🇳' },
  { name: 'Coreano', code: 'ko', flag: '🇰🇷' },
  { name: 'Árabe', code: 'ar', flag: '🇸🇦' },
  { name: 'Hindi', code: 'hi', flag: '🇮🇳' },
  { name: 'Holandês', code: 'nl', flag: '🇳🇱' },
  { name: 'Sueco', code: 'sv', flag: '🇸🇪' },
  { name: 'Norueguês', code: 'no', flag: '🇳🇴' },
  { name: 'Dinamarquês', code: 'da', flag: '🇩🇰' },
  { name: 'Finlandês', code: 'fi', flag: '🇫🇮' },
  { name: 'Polonês', code: 'pl', flag: '🇵🇱' },
  { name: 'Tcheco', code: 'cs', flag: '🇨🇿' },
  { name: 'Húngaro', code: 'hu', flag: '🇭🇺' },
  { name: 'Turco', code: 'tr', flag: '🇹🇷' },
  { name: 'Grego', code: 'el', flag: '🇬🇷' },
  { name: 'Hebraico', code: 'he', flag: '🇮🇱' },
  { name: 'Tailandês', code: 'th', flag: '🇹🇭' },
  { name: 'Vietnamita', code: 'vi', flag: '🇻🇳' },
  { name: 'Indonésio', code: 'id', flag: '🇮🇩' },
  { name: 'Malaio', code: 'ms', flag: '🇲🇾' },
  { name: 'Romeno', code: 'ro', flag: '🇷🇴' },
  { name: 'Ucraniano', code: 'uk', flag: '🇺🇦' },
  { name: 'Búlgaro', code: 'bg', flag: '🇧🇬' }
];

export function getLanguageByCode(code: string): Language | undefined {
  return languages.find(lang => lang.code === code);
}

export function getLanguageByName(name: string): Language | undefined {
  return languages.find(lang => lang.name.toLowerCase() === name.toLowerCase());
}

export function searchLanguages(query: string): Language[] {
  if (!query) return languages;
  
  const lowerQuery = query.toLowerCase();
  return languages.filter(
    lang => lang.name.toLowerCase().includes(lowerQuery) || 
            lang.code.toLowerCase().includes(lowerQuery)
  );
} 