import CreateThought from '@/components/CreateThought';

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';


const CreateThoughtPage = () => {
  const queryClient = new QueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
    <div className='hero min-h-screen bg-base-200'>
      <CreateThought/> 
    </div>
    </HydrationBoundary>
  );
};

export default CreateThoughtPage;