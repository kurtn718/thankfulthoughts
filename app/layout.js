import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { LanguageProvider } from '@/contexts/LanguageContext';
import ClerkProviderWithLocalization from '@/components/ClerkProviderWithLocalization';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Thankful Thoughts',
  description:
    'Thankful Thoughts: An AI-powered app that helps you express gratitude and improve your mental health.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <ClerkProviderWithLocalization>
            <Providers>{children}</Providers>
          </ClerkProviderWithLocalization>
        </LanguageProvider>
      </body>
    </html>
  );
}
