'use client';
import { useLanguage } from '@/contexts/LanguageContext';
import en from '@/translations/en';
import es from '@/translations/es';

const translations = { en, es };

export function useTranslation() {
  const { locale, setLocale } = useLanguage();

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[locale];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return { t, locale, setLocale };
} 