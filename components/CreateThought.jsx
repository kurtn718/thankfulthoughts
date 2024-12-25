'use client';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { generateChatResponse } from '@/utils/actions';
import { saveThought } from '@/utils/db-utils';
import { useUser } from '@clerk/nextjs';

const CreateThought = () => {
  const { user } = useUser();
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoadingWelcome, setIsLoadingWelcome] = useState(true);
  const [currentContext, setCurrentContext] = useState(null);
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
    
    generateChatResponse([], welcomeQuery, "hello@thankful-thoughts.com")
      .then((response) => {
        if (response) {
          try {
            const jsonResponse = JSON.parse(response.content);
            setMessages(prev => {
              if (prev.length === 0) {
                return [{ role: 'assistant', content: jsonResponse.content }];
              }
              return prev;
            });
          } catch (error) {
            console.error('Failed to parse JSON response:', error);
          }
        }
      })
      .finally(() => {
        setIsLoadingWelcome(false);
      });
  }, []);

  const { mutate, isPending } = useMutation({
    mutationFn: (query) => generateChatResponse(messages, query, user.emailAddresses[0]?.emailAddress),
    onSuccess: (data) => {
      if (!data) {
        console.error('No data returned from mutation');
        toast.error('Something went wrong');
        return;
      }
      try {
        console.log('Raw LLM response:', data);
        const jsonResponse = JSON.parse(data.content);
        console.log('Parsed JSON response:', jsonResponse);
        
        // Add the response to messages
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: jsonResponse.content 
        }]);

        // If this is a message that can be saved, store the context and add save prompt
        if (jsonResponse.askToSave) {
          console.log('Save prompt triggered:', {
            personName: jsonResponse.personName,
            messageLength: jsonResponse.content?.length,
            savePrompt: jsonResponse.savePrompt
          });

          setCurrentContext({
            personName: jsonResponse.personName,
            message: jsonResponse.content
          });
          
          // Add save prompt as a new message - without passing the function
          setMessages(prev => {
            console.log('Adding save prompt to messages');
            return [...prev, {
              role: 'assistant',
              content: jsonResponse.savePrompt || 'Would you like to save this message?',
              isSavePrompt: true
            }];
          });
        } else {
          console.log('Message not marked for saving');
        }
      } catch (error) {
        console.error('Failed to parse or handle JSON response:', {
          error: error.message,
          data: data,
          content: data?.content
        });
        setMessages(prev => [...prev, data]);
      }
    },
    onError: (error) => {
      console.error('Mutation error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
        // For server errors that might be wrapped
        serverError: error.serverError,
        response: error.response?.data,
      });
      setMessages((prev) => prev.slice(0, -1));
      toast.error(`Error: ${error.message || 'Something went wrong, please try again'}`);
    }
  });

  const handleSave = async () => {
    if (!currentContext || !user) {
      console.log('Save attempted without context or user:', { 
        hasContext: !!currentContext, 
        hasUser: !!user 
      });
      return;
    }
    
    try {
      console.log('Attempting to save with:', {
        userId: user.id,
        personName: currentContext.personName,
        messageLength: currentContext.message?.length,
        userEmail: user.emailAddresses[0]?.emailAddress
      });

      const result = await saveThought({
        userId: user.id,
        personName: currentContext.personName,
        message: currentContext.message,
        userDetails: {
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });

      console.log('Save result:', result);

      if (result.success) {
        toast.success('Thought saved successfully!');
        setCurrentContext(null);
        setMessages(prev => prev.slice(0, -1));
      } else {
        console.error('Save failed with:', result);
        throw new Error(result.details || result.error);
      }
    } catch (error) {
      console.error('Save error:', {
        message: error.message,
        cause: error.cause,
        stack: error.stack
      });
      toast.error(`Failed to save thought: ${error.message}`);
    }
  };

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
    <div className='h-[calc(100vh-6rem)] flex flex-col w-full max-w-full'>
      <div className='flex-1 overflow-y-auto'>
        {messages.map(({ role, content, isSavePrompt }, index) => {
          const avatar = role == 'user' ? '👤' : '🤖';
          const bcg = role == 'user' ? 'bg-base-200' : 'bg-base-100';
          return (
            <div
              key={index}
              className={`${bcg} flex py-4 md:py-6 px-3 md:px-8 text-base md:text-xl leading-loose border-b border-base-300`}
            >
              <span className='mr-4'>{avatar}</span>
              <div className='flex-1'>
                <p className='break-words'>{content}</p>
                {isSavePrompt && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button 
                      onClick={handleSave}
                      className="btn btn-primary btn-sm"
                    >
                      Yes, save this message
                    </button>
                    <button 
                      onClick={() => setMessages(prev => prev.slice(0, -1))}
                      className="btn btn-ghost btn-sm"
                    >
                      No, thanks
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {(isPending || isLoadingWelcome) && (
          <div className='flex py-6 px-3 md:px-8'>
            <span className='mr-4'>🤖</span>
            <span className='loading loading-dots'></span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className='sticky bottom-0 py-4 px-3 md:px-8 bg-base-200'>
        <div className='join w-full max-w-4xl mx-auto gap-2'>
          <input
            type='text'
            placeholder='Message Thankful Thoughts'
            className='input input-bordered join-item flex-1 px-3 py-4'
            value={text}
            required
            onChange={(e) => setText(e.target.value)}
            disabled={isLoadingWelcome}
          />
          <button 
            className='btn btn-primary join-item whitespace-nowrap'
            type='submit' 
            disabled={isPending || isLoadingWelcome}
          >
            {isPending || isLoadingWelcome ? 'Loading...' : 'Create Thought'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateThought;