import { GoogleGenAI } from '@google/genai';

let ai: GoogleGenAI | null = null;

export const getGeminiClient = () => {
  if (!ai) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || 'dummy_key',
    });
  }
  return ai;
};
