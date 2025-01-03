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
  const [previousText, setPreviousText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoadingWelcome, setIsLoadingWelcome] = useState(true);
  const [currentContext, setCurrentContext] = useState(null);
  const [messageLength, setMessageLength] = useState('medium');
  const welcomeMessageSent = useRef(false);

  useEffect(() => {
    if (welcomeMessageSent.current) return;
    
    const welcomeQuery = {
      role: 'user',
      content: `Generate a friendly welcome message with these key points:
        1. Explain that the user only has to specify the name of the person they want to send a message to
        and anything special or details they want to include.
        2. Keep the tone friendly and inviting, but concise. `,
      messageLength: 'medium'
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

  const getLastPersonNameFromMessages = (messages) => {
    console.log('*** Messages:', messages);
    const lastPersonName = [...messages]
      .reverse()
      .find(msg => {
        if (msg.role === 'assistant') {
          try {
            // We need to parse the content if it's a JSON string
            const parsed = JSON.parse(msg.content);
            return parsed.personName != null;
          } catch (e) {
            // If we already have a parsed object with personName
            return msg.personName != null;
          }
        }
        return false;
      });

    // Return just the personName, either from parsed content or direct property
    if (lastPersonName) {
      if (lastPersonName.personName) {
        return lastPersonName.personName;
      }
      try {
        const parsed = JSON.parse(lastPersonName.content);
        return parsed.personName;
      } catch (e) {
        return null;
      }
    }
    return null;
  };
  

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

        const lastPersonName = getLastPersonNameFromMessages(messages);

        if (lastPersonName && jsonResponse.personName && jsonResponse.personName != lastPersonName) {
          console.log('*** New person:', jsonResponse.personName, 'vs', lastPersonName);

          // Mark all existing messages as skipContext and remove personName
          setMessages(prev => {
            const updatedMessages = prev.map(msg => ({ 
              ...msg, 
              skipContext: true, 
              personName: null 
            }));
            
            // Create new query with the updated context and messageLength
            const query = {
              role: 'user',
              content: previousText,
              messageLength: messageLength
            };
            
            // Wait for next tick to ensure state is updated
            setTimeout(() => {
              console.log('Resubmitting with updated context:', {
                messagesWithSkipContext: updatedMessages.filter(m => m.skipContext).length,
                totalMessages: updatedMessages.length,
                messageLength: messageLength
              });
              mutate(query);
            }, 0);
            
            return updatedMessages;
          });
          return;
        }
        
        // Add the response to messages with messageLength
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: jsonResponse.content,
          skipContext: false,
          personName: jsonResponse.personName,
          messageLength: messageLength
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
      messageLength: messageLength,
    };
    setMessages((prev) => [...prev, query]);
    setPreviousText(text);
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

      <form onSubmit={handleSubmit} className='sticky bottom-0 py-4 px-2 sm:px-3 md:px-8 bg-base-200'>
        <div className='flex flex-col w-full max-w-4xl mx-auto gap-2'>
          <div className='join w-full gap-1 sm:gap-2'>
            <input
              type='text'
              placeholder='Message Thankful Thoughts'
              className='input input-bordered join-item flex-1 px-2 sm:px-3 py-4 min-w-0'
              value={text}
              required
              onChange={(e) => setText(e.target.value)}
              disabled={isLoadingWelcome}
            />
            <button 
              className='btn btn-primary join-item !px-2 sm:!px-4'
              type='submit' 
              disabled={isPending || isLoadingWelcome}
            >
              {isPending || isLoadingWelcome ? 'Loading...' : 'Create'}
            </button>
          </div>

          <div className='flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2'>
            <label className='text-xs sm:text-sm text-gray-500 whitespace-nowrap'>Message Length:</label>
            <div className="btn-group shadow-md">
              <button
                type="button"
                className={`btn btn-sm border transition-all
                  ${messageLength === 'short' 
                    ? 'bg-gradient-to-b from-slate-50 to-slate-200 border-slate-300 shadow-inner' 
                    : 'bg-gradient-to-b from-white to-slate-100 hover:from-slate-50 hover:to-slate-200'}`}
                onClick={() => setMessageLength('short')}
              >
                Short
              </button>
              <button
                type="button"
                className={`btn btn-sm border transition-all
                  ${messageLength === 'medium' 
                    ? 'bg-gradient-to-b from-slate-50 to-slate-200 border-slate-300 shadow-inner' 
                    : 'bg-gradient-to-b from-white to-slate-100 hover:from-slate-50 hover:to-slate-200'}`}
                onClick={() => setMessageLength('medium')}
              >
                Medium
              </button>
              <button
                type="button"
                className={`btn btn-sm border transition-all
                  ${messageLength === 'long' 
                    ? 'bg-gradient-to-b from-slate-50 to-slate-200 border-slate-300 shadow-inner' 
                    : 'bg-gradient-to-b from-white to-slate-100 hover:from-slate-50 hover:to-slate-200'}`}
                onClick={() => setMessageLength('long')}
              >
                Long
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateThought;