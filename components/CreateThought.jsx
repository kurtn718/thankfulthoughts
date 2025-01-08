'use client';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { generateChatResponse } from '@/utils/actions';
import { saveThought } from '@/utils/db-utils';
import { useUser } from '@clerk/nextjs';
import Avatar from './Avatar';

const CreateThought = () => {
  const { user, isLoaded } = useUser();
  const [text, setText] = useState('');
  const [previousText, setPreviousText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoadingWelcome, setIsLoadingWelcome] = useState(true);
  const [currentContext, setCurrentContext] = useState(null);
  const [messageLength, setMessageLength] = useState('medium');
  const welcomeMessageSent = useRef(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isLoaded) {
      console.log('User data loaded:', {
        isLoaded,
        user: user,
        firstName: user?.firstName,
        lastName: user?.lastName,
        fullName: user?.fullName,
      });
    }
  }, [isLoaded, user]);

  const getSpecialWelcomeMessage = (firstName, lastName) => {
    if (!firstName || !lastName) return null;
    
    const welcomeMessages = [
      { 
        firstName: 'Matt', 
        lastName: 'Wilkey', 
        message: "Matt, this is President-Elect Trump - let me be clear—this team thrives on loyalty, on respect, and, frankly, on recognizing greatness when you see it. I didn't hear enough praise about me, Matt. Not nearly enough. And for that... you're fired!", 
        role: 'trump' 
      },
      { 
        firstName: 'Matthew', 
        lastName: 'Wilkey', 
        message: "Matt, this is President-Elect Trump - let me be clear—this team thrives on loyalty, on respect, and, frankly, on recognizing greatness when you see it. I didn't hear enough praise about me, Matt. Not nearly enough. And for that... you're fired!", 
        role: 'trump' 
      },
      { 
        firstName: 'Kurt', 
        lastName: 'Niemi', 
        message: 'Kurt, this is President-Elect Trump - I want to hire you for your Generative AI expertise!', 
        role: 'trump' 
      },
      { 
        firstName: 'Natasha', 
        lastName: 'Usher', 
        message: 'Natasha, this is Felix. Your husband hired me to say hello to you - and we both agree that you are awesome!', 
        role: 'felix'
      }
    ];

    const welcomeMessage = welcomeMessages.find(person => 
      person.firstName === firstName && 
      person.lastName === lastName
    );

    return welcomeMessage ? {
      role: welcomeMessage.role,
      content: welcomeMessage.message,
      skipContext: true
    } : null;
  };

  useEffect(() => {
    if (!isLoaded || welcomeMessageSent.current) return;
    
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

            // Only proceed with special welcome message if user data is loaded
            const specialWelcome = isLoaded && user ? 
              getSpecialWelcomeMessage(user.firstName, user.lastName) : 
              null;

            setMessages(prev => {
              if (prev.length === 0) {
                if (specialWelcome) {
                  return [
                    { role: 'assistant', content: jsonResponse.content }, 
                    specialWelcome
                  ];
                }
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
  }, [isLoaded, user]);

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
  

  const handlePersonChange = (llmResponse, lastPersonName, messages, previousText, messageLength, mutate) => {
    if (!lastPersonName || !llmResponse.personName || llmResponse.personName === lastPersonName) {
      return false;
    }

    console.log('*** New person:', llmResponse.personName, 'vs', lastPersonName);

    // Create new query with the updated context and messageLength
    const query = {
      role: 'user',
      content: previousText,
      messageLength: messageLength
    };

    // Mark all existing messages as skipContext and remove personName
    setMessages(prev => {
      // Only update messages if we haven't already marked them
      if (prev.some(msg => !msg.skipContext)) {
        const updatedMessages = prev.map(msg => ({
          role: msg.role,
          content: msg.content,
          skipContext: true,
          messageLength: msg.messageLength,
          ...(msg.isSavePrompt && { isSavePrompt: true })
        }));

        // Schedule mutation for next tick after state update
        setTimeout(() => {
          console.log('Resubmitting with updated context:', {
            messagesWithSkipContext: updatedMessages.filter(m => m.skipContext).length,
            totalMessages: updatedMessages.length,
            messageLength: messageLength
          });
          mutate(query);
        }, 0);

        return updatedMessages;
      }
      return prev;
    });

    return true;
  };

  const processLLMResponse = (data, messages, previousText, messageLength, mutate) => {
    console.log('Raw LLM response:', data);

    const llmResponse = Array.isArray(data) 
      ? JSON.parse(data[0].content)
      : JSON.parse(data.content);
          
    console.log('Parsed LLM response:', llmResponse);

    const lastPersonName = getLastPersonNameFromMessages(messages);

    // If person changed, don't process this response
    if (handlePersonChange(llmResponse, lastPersonName, messages, previousText, messageLength, mutate)) {
      return null;
    }

    // Add the response to messages with messageLength
    if (Array.isArray(data)) {
      const processedMessages = data.map(msg => {
        try {
          const parsedContent = JSON.parse(msg.content);
          return {
            ...msg,
            content: parsedContent.content || parsedContent,
            role: msg.role || parsedContent.role || 'assistant'
          };
        } catch (e) {
          return msg;
        }
      });
      setMessages(prev => [...prev, ...processedMessages]);
    } else {
      setMessages(prev => [...prev, { 
        role: data.role, 
        content: llmResponse.content,
        skipContext: false,
        personName: llmResponse.personName,
        messageLength: messageLength
      }]);
    }

    return llmResponse;
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
        const llmResponse = processLLMResponse(data, messages, previousText, messageLength, mutate);
        
        // Only process save prompt if we have a response (not changing person)
        if (llmResponse?.askToSave) {
          console.log('Save prompt triggered:', {
            personName: llmResponse.personName,
            messageLength: llmResponse.content?.length,
            savePrompt: llmResponse.savePrompt
          });

          setCurrentContext({
            personName: llmResponse.personName,
            message: llmResponse.content
          });
          
          setMessages(prev => {
            console.log('Adding save prompt to messages');
            return [...prev, {
              role: 'assistant',
              content: llmResponse.savePrompt || 'Would you like to save this message?',
              isSavePrompt: true
            }];
          });
        } else if (llmResponse) {
          console.log('Message not marked for saving');
        }
      } catch (error) {
        console.error('Failed to parse or handle LLM response:', {
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className='h-[calc(100vh-6rem)] flex flex-col w-full max-w-full'>
      <div className='flex-1 overflow-y-auto'>
        {messages.map(({ role, content, isSavePrompt }, index) => {
          const bcg = role === 'user' ? 'bg-base-200' : 'bg-base-100';
          return (
            <div
              key={index}
              className={`${bcg} flex py-4 md:py-6 px-3 md:px-8 text-base md:text-xl leading-loose border-b border-base-300`}
            >
              <span className='mr-6 flex items-center'>
                <Avatar role={role} />
              </span>
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
            <span className='mr-6'>
              <Avatar role="assistant" />
            </span>
            <span className='loading loading-dots'></span>
          </div>
        )}
        <div ref={messagesEndRef} />
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