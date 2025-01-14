'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { esES, enUS } from '@clerk/localizations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    const browserLang = navigator.language.split('-')[0];
    setLocale(browserLang === 'es' ? 'es' : 'en');
  }, []);

  const clerkLocalization = locale === 'es' ? esES : enUS;

  return (
    <LanguageContext.Provider value={{ locale, setLocale, clerkLocalization }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext); 