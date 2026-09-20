import { GoogleGenAI } from '@google/genai';
import { env } from './src/config/env.js';

async function test() {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  console.log("Key starting with: " + (env.GEMINI_API_KEY ? env.GEMINI_API_KEY.substring(0, 10) : 'none'));
  
  const MODEL = 'gemini-1.5-flash-8b';
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ text: 'Respond with OK in JSON: {"status": "OK"}' }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      }
    });
    console.log("Response text:", response.text);
  } catch (err) {
    console.error("SDK Error:", err);
  }
}
test();
