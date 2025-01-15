'use client';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <select 
      value={locale} 
      onChange={(e) => setLocale(e.target.value)}
      className="select select-bordered select-sm"
    >
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="ja">日本語</option>
      <option value="fr">Français</option>
    </select>
  );
} 