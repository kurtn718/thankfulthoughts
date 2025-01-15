'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { esES, enUS, jaJP, frFR } from '@clerk/localizations';

const LanguageContext = createContext();

// Get initial language - moved to a function to use both in useState and useEffect
const getInitialLanguage = () => {
  // Server-side or initial render always defaults to 'en'
  if (typeof window === 'undefined') return 'en';
  
  const browserLang = window.navigator.language.split('-')[0];
  return ['en', 'es', 'ja', 'fr'].includes(browserLang) ? browserLang : 'en';
};

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(getInitialLanguage());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setLocale(getInitialLanguage());
  }, []);

  const clerkLocalizations = {
    en: enUS,
    es: esES,
    ja: jaJP,
    fr: frFR
  };

  // Only render children when on client to prevent hydration mismatch
  if (!isClient) {
    return (
      <LanguageContext.Provider value={{ 
        locale: 'en', 
        setLocale, 
        clerkLocalization: clerkLocalizations['en'] 
      }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ 
      locale, 
      setLocale, 
      clerkLocalization: clerkLocalizations[locale] 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext); 