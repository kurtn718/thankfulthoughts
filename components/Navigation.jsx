'use client';
import NavLinks from './NavLinks';
import LanguageSwitcher from './LanguageSwitcher';

const Navigation = () => {
  return (
    <div className="drawer-side">
      <label htmlFor="my-drawer-2" className="drawer-overlay"></label>
      <div className="p-4 w-80 min-h-full bg-base-200 text-base-content">
        <div className="flex flex-col h-full">
          <NavLinks />
          <div className="mt-auto pb-4">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation; 