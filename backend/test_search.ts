import { PrismaClient } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';
import { env } from './src/config/env.js';

async function test() {
  const prisma = new PrismaClient();
  const candidates = await prisma.candidate.findMany({ take: 5 });
  
  const query = "photoshop";
  const prompt = `
You are an expert technical recruiter AI.
Evaluate which candidates best match the user's natural language search query.

Query: "${query}"

Candidates:
${candidates.map(c => `ID: ${c.id}\nName: ${c.name}\nRole: ${c.currentRole}\nSkills: ${c.skills.join(', ')}`).join('\n\n')}

Return ONLY a valid JSON array of objects. Do not include markdown formatting like \`\`\`json.
Each object must have:
- id: string
- relevanceScore: number (0-100)
- matchReasons: array of objects with {label: string, source: string, detail: string}
`;

  console.log("Prompt length:", prompt.length);

  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: [{text: prompt}],
    config: {
      temperature: 0.2,
      responseMimeType: "application/json",
    }
  });
  
  console.log(response.text);
}
test().catch(console.error);
