import { GoogleGenAI } from '@google/genai';
import { env } from './src/config/env.js';

async function test() {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: [{text: "Hello"}]
  });
  console.log("Response text:", response.text);
}
test();
