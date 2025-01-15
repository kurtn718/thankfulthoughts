'use client';

import ThemeToggle from './ThemeToggle';
import { useTranslation } from '@/hooks/useTranslation';

const SidebarHeader = () => {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center p-4">
      <div className="flex-1">
        <h1 className="text-xl font-semibold">
          {t('home.title')}
        </h1>
      </div>
      <ThemeToggle />
    </div>
  );
};

export default SidebarHeader;
