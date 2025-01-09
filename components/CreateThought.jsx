'use client';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { generateChatResponse } from '@/utils/actions';
import { saveThought, getWelcomeThought } from '@/utils/db-utils';
import { useUser } from '@clerk/nextjs';
import Avatar from './Avatar';
import { welcomeMessages } from '@/utils/welcome-messages';

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
  const latestUserMessageRef = useRef(null);
  const firstResponseRef = useRef(null);

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

  const getSpecialWelcomeMessage = async (firstName, lastName) => {
    if (!firstName || !lastName) return null;
    return await getWelcomeThought(firstName, lastName);
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
    
    const fetchWelcomeMessages = async () => {
      try {
        const response = await generateChatResponse([], welcomeQuery, "hello@thankful-thoughts.com");
        if (response) {
          const jsonResponse = JSON.parse(response.content);

          // Only proceed with special welcome message if user data is loaded
          const specialWelcome = isLoaded && user ? 
            await getSpecialWelcomeMessage(user.firstName, user.lastName) : 
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
        }
      } catch (error) {
        console.error('Failed to fetch welcome messages:', error);
      } finally {
        setIsLoadingWelcome(false);
      }
    };

    fetchWelcomeMessages();
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

  // Helper to check if element is fully in viewport
  const isElementVisible = (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };

  // Helper to check if element is partially visible
  const isElementPartiallyVisible = (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    return (
      rect.top < windowHeight &&
      rect.bottom > 0
    );
  };

  // Helper to scroll to element
  const scrollToElement = (element, options = {}) => {
    if (!element) return false;
    
    const defaultOptions = {
      behavior: "smooth",
      block: "start", // Changed to 'start' to maximize visible content
    };

    element.scrollIntoView({ ...defaultOptions, ...options });
    return true;
  };

  // Handle scroll after user input
  const handleUserInputScroll = () => {
    if (!latestUserMessageRef.current) return;
    // Add a small delay to ensure DOM has updated
    setTimeout(() => {
      scrollToElement(latestUserMessageRef.current, { block: "center" });
    }, 100);
  };

  // Handle scroll after response
  const handleResponseScroll = () => {
    const lastUserIndex = findLastUserMessageIndex(messages);
    const firstResponseIndex = findFirstResponseIndex(messages, lastUserIndex);
    
    // Check if we have a user message and at least one response after it
    const hasUserAndResponse = lastUserIndex !== -1 && firstResponseIndex < messages.length;

    if (hasUserAndResponse && latestUserMessageRef.current) {
      const userMessage = latestUserMessageRef.current;
      const firstResponse = firstResponseRef.current;

      // Add a small delay to ensure DOM has updated
      setTimeout(() => {
        // If first response exists but isn't fully visible, or there are more messages
        if (firstResponse && 
            (!isElementVisible(firstResponse) || messages.length > firstResponseIndex + 1)) {
          
          // If user message isn't fully visible, scroll to it first
          if (!isElementPartiallyVisible(userMessage)) {
            scrollToElement(userMessage, { block: "start" });
          }
          // Then try to show as much content as possible while keeping user message visible
          else if (!isElementVisible(firstResponse)) {
            scrollToElement(firstResponse, { block: "start" });
          }
        }
      }, 100);
    }
  };

  // Submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    const query = {
      role: 'user',
      content: text,
      messageLength: messageLength,
    };
    setMessages((prev) => [...prev, query]);
    setPreviousText(text);
    setText('');
    mutate(query);
    
    // Scroll after user input
    handleUserInputScroll();
  };

  // Scroll on new messages (responses)
  useEffect(() => {
    if (messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role !== 'user') {
      handleResponseScroll();
    }
  }, [messages]);

  // Find the last user message index
  const findLastUserMessageIndex = (messages) => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        return i;
      }
    }
    return -1;
  };

  // Find the first response after the last user message
  const findFirstResponseIndex = (messages, lastUserIndex) => {
    if (lastUserIndex === -1) return -1;
    return lastUserIndex + 1;
  };

  return (
    <div className='h-[calc(100vh-6rem)] flex flex-col w-full max-w-full'>
      <div className='flex-1 overflow-y-auto'>
        {messages.map(({ role, content, isSavePrompt }, index) => {
          const bcg = role === 'user' ? 'bg-base-200' : 'bg-base-100';
          const isLastUserMessage = index === findLastUserMessageIndex(messages);
          const isFirstResponse = index === findFirstResponseIndex(messages, findLastUserMessageIndex(messages));

          return (
            <div
              key={index}
              ref={isLastUserMessage 
                ? latestUserMessageRef 
                : isFirstResponse 
                  ? firstResponseRef 
                  : null}
              className={`${bcg} flex py-4 md:py-6 px-3 md:px-8 text-base md:text-xl leading-loose border-b border-base-300`}
            >
              <span className='mr-6 pt-1'>
                <Avatar role={role} />
              </span>
              <div className='flex-1'>
                <p className='break-words whitespace-pre-line'>{content}</p>
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