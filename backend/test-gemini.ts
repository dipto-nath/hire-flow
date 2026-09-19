import { GoogleGenAI } from '@google/genai';
import { env } from 'process';

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ text: "Hello" }]
    });
    console.log("Response:", response.text);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
