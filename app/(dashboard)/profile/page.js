import { UserProfile } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';

const UserProfilePage = () => {
  return <UserProfile routing='hash' />;
};
export default UserProfilePage;