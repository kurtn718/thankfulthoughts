'use server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateChatResponse = async (chatMessages, newMessage) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'meta-llama/llama-3.1-70b-instruct:free',
      temperature: 0,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        ...chatMessages,
        newMessage
      ],
    });

    if (!response || !response.choices || !response.choices[0]) {
      console.log('Invalid response structure:', response);
      return null;
    }

    return response.choices[0].message;
  } catch (error) {
    console.log('Error in generateChatResponse:', error);
    return null;
  }  
};
