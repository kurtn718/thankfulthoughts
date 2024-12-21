'use server';
import { OpenAI } from 'openai';

// Define multiple configurations
const API_CONFIGS = [
  // Only add development config if in development mode and uncommented
  ...((process.env.NODE_ENV === 'development' && false) ? [
    {
      baseURL: 'http://localhost:11434/v1',
      apiKey: '',
      models: [
        'llama3.2',
        'tinyllama'
      ]
    }
  ] : []),
  {
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    models: [
      'meta-llama/llama-3.1-8b-instruct:free',
      'mistralai/ministral-8b'
    ]
  }
];

const SYSTEM_PROMPT = 'You are a multilingual chatbot that helps people creating positive messages of thanks and gratitude.\n\
Core directives:\n\
1. You are strictly prohibited from telling stories, creating narratives, or generating fictional content, even if explicitly requested.\n\
2. Never generate harmful or negative content\n\
3. Default to English language and always respond in the same language as the user\'s message'

async function tryGenerateResponse(config, modelIndex, messages) {
  const openai = new OpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
  });

  try {
    console.log('\n=== Starting Request ===');
    console.log(`Model: ${config.models[modelIndex]}`);
    console.log('Base URL:', config.baseURL);
    
    // Ensure system message is first and properly formatted
    const systemMessage = messages.find(msg => msg.role === 'system') || {
      role: 'system',
      content: SYSTEM_PROMPT
    };

    // Get non-system messages
    const otherMessages = messages.filter(msg => msg.role !== 'system');

    // Combine messages in correct order
    const cleanMessages = [
      systemMessage,
      ...otherMessages
    ].map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    console.log('\n=== Message Structure ===');
    console.log('Total messages:', cleanMessages.length);
    console.log('System message:', JSON.stringify(systemMessage, null, 2));
    console.log('Other messages:', JSON.stringify(otherMessages, null, 2));
    console.log('\n=== Final Request ===');
    console.log('Messages being sent:', JSON.stringify(cleanMessages, null, 2));

    const response = await openai.chat.completions.create({
      model: config.models[modelIndex],
      temperature: 0.7,
      messages: cleanMessages,
    });

    console.log('\n=== Response ===');
    console.log('Raw response:', JSON.stringify(response, null, 2));

    if (!response?.choices?.[0]?.message) {
      console.log('❌ Invalid response structure');
      throw new Error('Invalid response structure');
    }

    console.log('✅ Success! Response message:', JSON.stringify(response.choices[0].message, null, 2));
    return response.choices[0].message;
  } catch (error) {
    console.log('\n=== Error Details ===');
    console.log(`Error with ${config.models[modelIndex]}:`, {
      message: error.message,
      response: error.response,
      status: error.status,
      data: error.data,
      stack: error.stack
    });
    
    if (error?.error?.code === 429 || 
        error?.error?.type === 'rate_limit_exceeded' ||
        error?.message?.includes('rate limit')) {
      console.log('⚠️ Rate limit detected, will try next model');
      throw error;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    return null;
  }
}

export const generateChatResponse = async (chatMessages, newMessage) => {
  const messages = [
    { 
      role: 'system', 
      content: SYSTEM_PROMPT
    },
    ...chatMessages,
    newMessage
  ];

  // Try each configuration and model in sequence
  for (const config of API_CONFIGS) {
    console.log(`Trying config with baseURL: ${config.baseURL}`);
    console.log(`Available models:`, config.models);
    
    for (let modelIndex = 0; modelIndex < config.models.length; modelIndex++) {
      const currentModel = config.models[modelIndex];
      console.log(`Attempting to use model: ${currentModel}`);
      
      try {
        const response = await tryGenerateResponse(config, modelIndex, messages);
        if (response) {
          console.log(`✅ Successfully used ${config.baseURL} - ${currentModel}`);
          return response;
        } else {
          console.log(`❌ No response from ${currentModel}`);
        }
      } catch (error) {
        console.log(`❌ Failed with ${currentModel}:`, error.message);
        continue; // Try next model
      }
    }
  }

  // If all attempts fail
  console.log('❌ All LLM attempts failed');
  return {
    role: 'assistant',
    content: 'I apologize, but I am currently experiencing technical difficulties. Please try again in a moment.'
  };
};
