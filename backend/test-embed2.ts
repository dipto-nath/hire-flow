import { GoogleGenAI } from '@google/genai';
import { env } from './src/config/env.js';

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

async function main() {
  const res = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: 'Hello world'
  });
  console.log('Embedding 001 length:', res.embeddings?.[0]?.values?.length);
  
  const res2 = await ai.models.embedContent({
    model: 'gemini-embedding-2',
    contents: 'Hello world'
  });
  console.log('Embedding 2 length:', res2.embeddings?.[0]?.values?.length);
}
main();
