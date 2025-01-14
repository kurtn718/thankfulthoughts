'use client';
import { ClerkProvider } from '@clerk/nextjs';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ClerkProviderWithLocalization({ children }) {
  const { clerkLocalization } = useLanguage();
  return <ClerkProvider localization={clerkLocalization}>{children}</ClerkProvider>;
} 