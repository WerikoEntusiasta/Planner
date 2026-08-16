import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode, LANGUAGES, LanguageOption, translations } from './translations';

export const detectUserLanguage = (): LanguageCode => {
  try {
    const userLangs = typeof navigator !== 'undefined' && navigator.languages 
      ? Array.from(navigator.languages) 
      : [typeof navigator !== 'undefined' ? navigator.language || '' : ''];

    for (const rawLang of userLangs) {
      if (!rawLang) continue;
      const l = rawLang.toLowerCase();
      if (l === 'pt-pt' || l === 'pt-mo') return 'pt-PT';
      if (l.startsWith('pt')) return 'pt-BR';
      if (l.startsWith('en')) return 'en';
      if (l.startsWith('es')) return 'es';
      if (l === 'zh-tw' || l === 'zh-hk' || l === 'zh-hant') return 'zh-TW';
      if (l.startsWith('zh')) return 'zh-CN';
      if (l.startsWith('ja')) return 'ja';
      if (l.startsWith('ko')) return 'ko';
      if (l.startsWith('hi')) return 'hi';
    }

    // Timezone heuristic if available
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (
        timeZone.startsWith('America/Sao_Paulo') || 
        timeZone.startsWith('America/Belem') || 
        timeZone.startsWith('America/Manaus') || 
        timeZone.startsWith('America/Fortaleza') || 
        timeZone.startsWith('America/Recife') || 
        timeZone.startsWith('America/Cuiaba')
      ) {
        return 'pt-BR';
      }
      if (timeZone.startsWith('Europe/Lisbon')) {
        return 'pt-PT';
      }
      if (timeZone.startsWith('Europe/Madrid')) {
        return 'es';
      }
      if (
        timeZone.startsWith('America/') || 
        timeZone.startsWith('Europe/London') || 
        timeZone.startsWith('Australia/') || 
        timeZone.startsWith('Pacific/')
      ) {
        return 'en';
      }
    }
  } catch (err) {
    console.warn('Language detection fallback:', err);
  }
  return 'pt-BR'; // Default fallback
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  isAutoDetected: boolean;
  resetToAuto: () => void;
  detectedLanguage: LanguageCode;
  currentLanguageOption: LanguageOption;
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [detectedLanguage] = useState<LanguageCode>(() => detectUserLanguage());
  
  const [isAutoDetected, setIsAutoDetected] = useState<boolean>(() => {
    return !localStorage.getItem('app_language');
  });

  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('app_language') as LanguageCode;
    if (saved && LANGUAGES.some(l => l.code === saved)) {
      return saved;
    }
    // Auto-detect if no manually saved preference exists
    return detectUserLanguage();
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    setIsAutoDetected(false);
    localStorage.setItem('app_language', lang);
  };

  const resetToAuto = () => {
    const autoLang = detectUserLanguage();
    setLanguageState(autoLang);
    setIsAutoDetected(true);
    localStorage.removeItem('app_language');
  };

  const currentLanguageOption = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  const t = (key: string, defaultText?: string): string => {
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to pt-BR if available
    const fallbackDict = translations['pt-BR'];
    if (fallbackDict && fallbackDict[key]) {
      return fallbackDict[key];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      isAutoDetected, 
      resetToAuto, 
      detectedLanguage, 
      currentLanguageOption, 
      t 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    const defaultOption = LANGUAGES[0];
    return {
      language: 'pt-BR',
      setLanguage: () => {},
      isAutoDetected: true,
      resetToAuto: () => {},
      detectedLanguage: 'pt-BR',
      currentLanguageOption: defaultOption,
      t: (key: string, defaultText?: string) => {
        const langDict = translations['pt-BR'];
        return (langDict && langDict[key]) || defaultText || key;
      }
    };
  }
  return context;
};

