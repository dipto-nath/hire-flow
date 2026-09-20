import { GoogleGenAI } from '@google/genai';
import { env } from './src/config/env.js';

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

async function main() {
  try {
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: 'Hello world'
    });
    console.log('Embedding length:', response.embeddings?.[0]?.values?.length);
  } catch (e) {
    console.error(e);
  }
}
main();
