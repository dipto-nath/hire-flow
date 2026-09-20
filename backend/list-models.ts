import { GoogleGenAI } from '@google/genai';
import { env } from './src/config/env.js';

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

async function main() {
  const models = await ai.models.list();
  for await (const model of models) {
    if (model.name.includes('embed')) console.log(model.name);
  }
}
main();
