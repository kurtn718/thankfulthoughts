import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className='min-h-screen flex justify-center items-center'>
      <SignIn routing="path" />
    </div>
  );
}