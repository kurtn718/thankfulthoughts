'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { generateChatResponse } from '@/utils/actions';

const Chat = () => {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);

  const { mutate, isPending } = useMutation({
    mutationFn: (query) => generateChatResponse(messages, query),
    onSuccess: (data) => {
      if (!data) {
        toast.error('Something went wrong');
        return;
      }
      setMessages((prev) => [...prev, data]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const query = {
      role: 'user',
      content: text,
    };
    mutate(query);
    setMessages((prev) => [...prev, query]);
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
            className={` ${bcg} flex py-6 -mx-8 px-8
                text-xl leading-loose border-b border-base-300`}
          >
            <span className='mr-4 '>{avatar}</span>
            <p className='max-w-3xl'>{content}</p>
          </div>
        );
      })}
      {isPending && <span className='loading'></span>}
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
          />
          <button className='btn btn-primary join-item px-6' type='submit' disabled={isPending}>
            {isPending ? 'Loading...' : 'Ask Question'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default Chat;
