import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const MODELS = {
  GPT4: 'gpt-4-turbo-preview',
  GPT35: 'gpt-3.5-turbo',
} as const;
