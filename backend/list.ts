import { GoogleGenAI } from '@google/genai';
import { env } from 'process';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
async function run() {
  try {
    const response = await ai.models.list();
    // In @google/genai, models.list() might return an async iterable or an object
    for await (const model of ai.models.list()) {
      console.log(model.name);
    }
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
