import { ENV } from './env.js';
import OpenAI from 'openai';

let openaiClient = null;

if (ENV.OPENAI_API_KEY) {
  try {
    openaiClient = new OpenAI({ apiKey: ENV.OPENAI_API_KEY });
  } catch (err) {
    console.warn('[AI Config] Failed to initialize OpenAI client:', err.message);
  }
}

export const getOpenAIClient = () => openaiClient;

export const hasValidAIKey = () => {
  return Boolean(ENV.GEMINI_API_KEY || ENV.OPENAI_API_KEY);
};
