import SidebarHeader from './SidebarHeader';
import NavLinks from './NavLinks';
import MemberProfile from './MemberProfile';

const Sidebar = () => {
  return (
    <div className='px-4 w-80 min-h-full bg-base-300 py-12 grid grid-rows-[auto,1fr,auto] '>
      <div>
        <SidebarHeader />
      </div>
      <div>
        <NavLinks />
      </div>
      <div className='h-12 flex items-center'>
        <MemberProfile />
      </div>
    </div>
  );
};
export default Sidebar;
