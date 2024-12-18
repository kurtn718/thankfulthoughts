'use server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateChatResponse = async (chatMessage) => {
  const response = await openai.chat.completions.create({
    model: 'meta-llama/llama-3.1-70b-instruct:free',
    temperature: 0,
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: chatMessage },
    ],
  });
//  console.log(response);
  console.log(response.choices[0].message.content);
  return response.choices[0].message.content;
};
