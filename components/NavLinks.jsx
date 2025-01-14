'use client';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import LanguageSwitcher from './LanguageSwitcher';

const NavLinks = () => {
  const { t } = useTranslation();
  
  const links = [
    {
      name: t('nav.createThought'),
      href: '/createthought',
    }, 
    {
      name: t('nav.myThoughts'),
      href: '/savedthoughts',
    },
    {
      name: t('nav.profile'),
      href: '/profile',
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ul className='menu text-base-content'>
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.name}</Link>
          </li>
        ))}
      </ul>
      <LanguageSwitcher />
    </div>
  );
};

export default NavLinks;
