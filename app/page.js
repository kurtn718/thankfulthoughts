'use client';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { useTranslation } from '@/hooks/useTranslation';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="hero min-h-[calc(100vh-48px)] bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-2xl">
            <h1 className="text-6xl font-bold text-primary">
              {t('home.title')}
            </h1>
            <p className="py-6 text-2xl text-base-content/80">
              {t('home.description')}
            </p>
            <Link href='/createthought' className='btn btn-secondary'>
              {t('home.getStarted')}
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
