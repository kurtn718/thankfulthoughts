import Chat from '@/components/Chat';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';


const ChatPage = () => {
  const queryClient = new QueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
    <div className='hero min-h-screen bg-base-200'>
      <Chat/> 
    </div>
    </HydrationBoundary>
  );
};

export default ChatPage;
