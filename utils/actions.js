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
    baseURL: 'https://openrouter.helicone.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    models: [
      'meta-llama/llama-3.1-8b-instruct:free',
      'meta-llama/llama-3.1-8b-instruct',
      'mistralai/ministral-8b'
    ],
    headers: {
      'Helicone-Auth': `Bearer ${process.env.HELICONE_API_KEY}`,
      'Helicone-Cache-Enabled': 'true',
      'HTTP-Referer': 'https://thankful-thoughts.com',
      'X-Title': 'Thankful Thoughts',
    }
  }
];

const USER_MESSAGE_PROMPT = `Create a response based on all of the previous messages and the users input. 
** IMPORTANT **
Always respond in valid JSON format with this structure:
   {
     "type": "response",
     "content": "your message here",
     "askToSave": boolean,
     "personName": "name if detected"
   }

Example response when user provides a name:
{
  "type": "response",
  "content": "Dear Sarah Jones, thank you for your unwavering support...",
  "askToSave": true,
  "personName": "Sarah Jones"
}

Example response for general query:
{
  "type": "response",
  "content": "I'd be happy to help you craft a thank you message. Who would you like to thank?",
  "askToSave": false
}

INPUT: 
`;

const SYSTEM_PROMPT = `You are a multilingual chatbot that helps people craft heartfelt messages of thanks and gratitude.

Core directives:
1. Your primary purpose is to assist in expressing gratitude, even if it includes acknowledging difficult or negative life events that someone helped the user navigate.
2. Always aim to focus on the positive impact or support received in the context of the user's message.
3. Decline requests unrelated to creating messages of thanks or gratitude.
4. Default to English and respond in the same language as the user's message.`;


async function tryGenerateResponse(config, modelIndex, messages, newMessage, userEmail) {
  const openai = new OpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
    defaultHeaders: {
      ...config.headers,
      'Helicone-User-Id': userEmail || 'anonymous',
    }
  });

  try {
    console.log('\n=== Starting Request ===');
    console.log(`Model: ${config.models[modelIndex]}`);
    console.log('Base URL:', config.baseURL);
    
    // Ensure system message is first and properly formatted
    const systemMessage = {
      role: 'system',
      content: SYSTEM_PROMPT
    };

    // Modify the new message by prepending USER_MESSAGE_PROMPT
    const modifiedNewMessage = {
      ...newMessage,
      content: `${USER_MESSAGE_PROMPT}${newMessage.content}`
    };

    // Create clean message array with system message and chat history
    const cleanMessages = [
      systemMessage,
      ...messages
        .filter(msg => msg.role !== 'system')    // Remove system messages
        .filter(msg => !msg.isSavePrompt)        // Remove save prompts
        .filter(msg => !msg.skipContext),        // Keep messages WITHOUT skipContext flag
      modifiedNewMessage  // Use the modified message
    ].map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    console.log('\n=== Message Structure ===');
    console.log('Total messages:', cleanMessages.length);
    console.log('System message:', JSON.stringify(systemMessage, null, 2));
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

    const message = response.choices[0].message;
    // Apply the correction to the message content
    const correctedContent = correctApiResponse(message.content);
    message.content = JSON.stringify(correctedContent);

    console.log('✅ Success! Response message:', JSON.stringify(message, null, 2));
    return message;
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

export const generateChatResponse = async (chatMessages, newMessage, userEmail) => {
  try {
    // Clean and transform previous messages to only include content from JSON responses
    const messages = [
      { 
        role: 'system', 
        content: SYSTEM_PROMPT
      },
      ...chatMessages.slice(0, -1).map(msg => {
        if (msg.role === 'assistant') {
          try {
            // Parse the JSON response and extract just the content
            const parsed = JSON.parse(msg.content);
            return {
              role: 'assistant',
              content: parsed.content
            };
          } catch (error) {
            // If parsing fails, use the original content
            return msg;
          }
        }
        return msg;
      })
    ];

    // Try each configuration and model in sequence
    for (const config of API_CONFIGS) {
      console.log(`Trying config with baseURL: ${config.baseURL}`);
      console.log(`Available models:`, config.models);
      
      for (let modelIndex = 0; modelIndex < config.models.length; modelIndex++) {
        const currentModel = config.models[modelIndex];
        console.log(`Attempting to use model: ${currentModel}`);
        
        try {
          // Pass newMessage separately to tryGenerateResponse
          const response = await tryGenerateResponse(config, modelIndex, messages, newMessage, userEmail);
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
    const error = new Error('Failed to generate response after all attempts');
    error.code = 'ALL_ATTEMPTS_FAILED';
    error.attempts = API_CONFIGS.map(c => c.models).flat().length;
    throw error;
  } catch (error) {
    console.error('Generate chat response error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
      attempts: error.attempts,
    });
    
    // Return error in a format that will be useful client-side
    return {
      role: 'assistant',
      content: JSON.stringify({
        type: 'error',
        content: 'I apologize, but I am currently experiencing technical difficulties. Please try again in a moment.',
        error: {
          message: error.message,
          code: error.code
        }
      })
    };
  }
};

function correctApiResponse(rawResponse) {
  // First try to parse the entire response as JSON
  try {
    const parsedResponse = JSON.parse(rawResponse);
    if (parsedResponse.type === "response") {

      // Search to see if parsedResponse.content has any JSON substring in it and store in a variable and remove from parsedResponse.content
      const jsonSubstring = parsedResponse.content.match(/(\{[\s\S]*\})/);
      if (jsonSubstring) {
        const jsonContent = jsonSubstring[0];
        parsedResponse.content = parsedResponse.content.replace(jsonSubstring[0], '');

        // If jsonContent is valid JSON and it has content, askToSave, or personName store those in variables
        const jsonContentObject = JSON.parse(jsonContent);
        const content = jsonContentObject.content;
        const askToSave = jsonContentObject.askToSave;
        const personName = jsonContentObject.personName;

        // Combine the content with the rest of the parsedResponse.content
        parsedResponse.content = `${parsedResponse.content}\n\n${content}`;
        // If askToSave was already true, keep it true, otherwise set it to askToSave
        parsedResponse.askToSave = askToSave || parsedResponse.askToSave;
        parsedResponse.personName = personName || parsedResponse.personName;
      }

      return {
        type: parsedResponse.type,
        content: parsedResponse.content,
        askToSave: parsedResponse.askToSave ?? false,
        personName: parsedResponse.personName || null,
        skipContext: false
      };
    }
  } catch (error) {
    // Not valid JSON, continue to next step
  }

  // Look for JSON at the end of the string
  const jsonMatch = rawResponse.match(/(\{[\s\S]*\})$/);
  if (jsonMatch) {
    try {
      const jsonPart = JSON.parse(jsonMatch[0]);
      const textPart = rawResponse.slice(0, jsonMatch.index).trim();

      // Combine text part with JSON content if both exist
      const combinedContent = textPart
        ? `${textPart}\n\n${jsonPart.content || ''}`
        : jsonPart.content;

      return {
        type: "response",
        content: combinedContent,
        askToSave: jsonPart.askToSave ?? false,
        personName: jsonPart.personName || null,
        skipContext: false
      };
    } catch (error) {
      console.warn("Failed to parse JSON part:", error);
    }
  }

  // Fallback return if no valid JSON found
  return {
    type: "response",
    content: rawResponse,
    askToSave: false,
    personName: null,
    skipContext: false
  };
}