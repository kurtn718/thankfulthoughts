import { UserButton } from '@clerk/nextjs';
import { auth, currentUser } from '@clerk/nextjs/server';

const MemberProfile = async () => {
  const user = await currentUser();
  
  return (
    <div className='flex items-center gap-3'>
      <UserButton signOutUrl='/' />
      <div className='w-[220px] overflow-hidden'>
        <p className='text-sm text-base-content truncate'>
          {user?.emailAddresses[0]?.emailAddress}
        </p>
      </div>
    </div>
  );
};

export default MemberProfile;
