import { GoogleGenAI } from '@google/genai';
import { env } from './src/config/env.js';

async function test() {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const response = await ai.models.list();
  
  // Print out available models that support generateContent
  const validModels = [];
  for await (const model of response) {
    if (model.supportedActions?.includes("generateContent")) {
      validModels.push(model.name);
    }
  }
  console.log("Available generation models:", validModels.join(", "));
}
test().catch(console.error);
