import { Suspense } from 'react';
import CreateThought from '@/components/CreateThought';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

export default async function CreateThoughtPage() {
  const queryClient = new QueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className='hero min-h-screen bg-base-200'>
        <Suspense fallback={<div>Loading...</div>}>
          <CreateThought />
        </Suspense>
      </div>
    </HydrationBoundary>
  );
}