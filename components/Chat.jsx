'use client';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { generateChatResponse } from '@/utils/actions';

const Chat = () => {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoadingWelcome, setIsLoadingWelcome] = useState(true);
  const welcomeMessageSent = useRef(false);

  useEffect(() => {
    if (welcomeMessageSent.current) return;
    
    const welcomeQuery = {
      role: 'user',
      content: `Generate a friendly welcome message with these key points:
        1. Explain that the user only has to specify the name of the person they want to send a message to
        and anything special or details they want to include.
        2. Keep the tone friendly and inviting, but concise (max 3-4 sentences).`
    };
    
    welcomeMessageSent.current = true;
    
    generateChatResponse([], welcomeQuery)
      .then((response) => {
        if (response) {
          setMessages(prev => {
            if (prev.length === 0) {
              return [{ role: 'assistant', content: response.content }];
            }
            return prev;
          });
        }
      })
      .finally(() => {
        setIsLoadingWelcome(false);
      });
  }, []);

  const { mutate, isPending } = useMutation({
    mutationFn: (query) => generateChatResponse(messages, query),
    onSuccess: (data) => {
      if (!data) {
        toast.error('Something went wrong');
        return;
      }
      setMessages((prev) => [...prev, data]);
    },
    onError: (error) => {
      setMessages((prev) => prev.slice(0, -1));
      toast.error('Something went wrong, please try again');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const query = {
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, query]);
    mutate(query);
    setText('');
  };
  return (
    <div className='min-h-[calc(100vh-6rem)] grid grid-rows-[auto,1fr,auto] gap-4 pb-8'>
    <div>
      {messages.map(({ role, content }, index) => {
        const avatar = role == 'user' ? '👤' : '🤖';
        const bcg = role == 'user' ? 'bg-base-200' : 'bg-base-100';
        return (
          <div
            key={index}
            className={`${bcg} flex py-6 -mx-8 px-8 text-xl leading-loose border-b border-base-300`}
          >
            <span className='mr-4'>{avatar}</span>
            <p className='max-w-3xl'>{content}</p>
          </div>
        );
      })}
      {(isPending || isLoadingWelcome) && (
        <div className='flex py-6 -mx-8 px-8'>
          <span className='mr-4'>🤖</span>
          <span className='loading loading-dots'></span>
        </div>
      )}
    </div>

      <form onSubmit={handleSubmit} className='max-w-4xl mx-auto w-full'>
        <div className='join w-full gap-2'>
          <input
            type='text'
            placeholder='Message Thankful Thoughts'
            className='input input-bordered join-item flex-1 px-40 py-6'
            value={text}
            required
            onChange={(e) => setText(e.target.value)}
            disabled={isLoadingWelcome}
          />
          <button 
            className='btn btn-primary join-item px-6' 
            type='submit' 
            disabled={isPending || isLoadingWelcome}
          >
            {isPending || isLoadingWelcome ? 'Loading...' : 'Ask Question'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default Chat;
