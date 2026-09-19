import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/services/aiService.ts');
const lines = fs.readFileSync(file, 'utf8').split('\n');

const delayHelper = `
import fs from 'fs';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function generateWithRetry(prompt: string, fileData?: { path: string, mimeType: string }, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const parts: any[] = [];
      if (fileData) {
        const base64 = fs.readFileSync(fileData.path).toString("base64");
        parts.push({
          inlineData: {
            data: base64,
            mimeType: fileData.mimeType
          }
        });
      }
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: parts,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2, // unified temp
        }
      });
      
      const responseText = response.text;
      if (!responseText) throw new Error('No response from Gemini');
      
      return JSON.parse(responseText);
    } catch (error: any) {
      console.log(\`Gemini Error (attempt \${i+1}):\`, error.message);
      if (i === retries - 1) throw error;
      if (error.status === 429 || error.status === 503 || (error.message && error.message.includes('429'))) {
        const waitMs = 5000 * Math.pow(2, i);
        console.log(\`Rate limited or busy. Waiting \${waitMs}ms before retry...\`);
        await delay(waitMs);
      } else {
        throw error;
      }
    }
  }
}
`;

// Insert after GoogleGenAI import
const importIdx = lines.findIndex(l => l.includes("import { GoogleGenAI } from '@google/genai';"));
lines.splice(importIdx + 1, 0, delayHelper);

// Modify signatures
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export async function processDocument(')) {
    lines[i+4] = '  filePath: string,';
    lines[i+5] = '  mimeType: string,';
    lines.splice(i+6, 0, '  documentType: string');
  }
  
  if (lines[i].includes('const profile = await extractCandidateProfile(text);')) {
    lines[i] = '  const profile = await extractCandidateProfile(filePath, mimeType);';
  }

  if (lines[i].includes('await prisma.candidate.update({')) {
    const updateStart = i;
    // The previous block already has the if (profile.email) fix since it's in the latest code? Wait, no, we need to add the empty email fix manually because we reverted to the base migration.
    // Replace the block from await prisma.candidate.update({ ... });
    lines[i] = `
  const updateData: any = {
    name: profile.name,
    firstName: profile.firstName,
    lastName: profile.lastName,
    currentRole: profile.currentRole,
    currentCompany: profile.currentCompany,
    location: profile.location,
    yearsExperience: profile.yearsExperience,
    skills: profile.skills,
    education: profile.education,
  };
  if (profile.email) updateData.email = profile.email;
  
  await prisma.candidate.update({
    where: { id: candidateId },
    data: updateData,
  });
    `;
    // clear the next 14 lines
    for (let j = 1; j <= 14; j++) lines[i+j] = '';
  }

  if (lines[i].includes('const matches = await matchRequirements(job.requirements, profile, text, documentType);')) {
    lines[i] = '  const matches = await matchRequirements(job.requirements, profile, filePath, mimeType, documentType);';
  }

  if (lines[i].includes('await processDocument(resumeDoc.id, candidateId, jobId, resumeDoc.extractedText, \'resume\');')) {
    lines[i] = '            await processDocument(resumeDoc.id, candidateId, jobId, resumeDoc.filePath!, \'application/pdf\', \'resume\');';
  }

  if (lines[i].includes('async function extractCandidateProfile(text: string): Promise<ExtractedCandidateProfile> {')) {
    lines[i] = 'async function extractCandidateProfile(filePath: string, mimeType: string): Promise<ExtractedCandidateProfile> {';
  }

  if (lines[i].includes('Resume text:')) {
    lines[i] = '';
    lines[i+1] = '';
  }

  if (lines[i].includes('async function matchRequirements(')) {
    lines[i+3] = '  filePath: string,';
    lines[i+4] = '  mimeType: string,';
    lines.splice(i+5, 0, '  documentType: string');
  }

  if (lines[i].includes('Full Resume Text:')) {
    lines[i] = '';
    lines[i+1] = '';
  }
}

let code = lines.join('\n');

const genAiBlock = /const response = await ai\.models\.generateContent\(\{[\s\S]*?config: \{[\s\S]*?\}[\s\S]*?\}\);[\s\S]*?if \(!.*?\) throw new Error\('No response from Gemini'\);/mg;

code = code.replace(genAiBlock, "const parsed = await generateWithRetry(prompt, arguments.length === 2 && typeof arguments[0] === 'string' && typeof arguments[1] === 'string' && arguments[1].includes('/') ? { path: arguments[0], mimeType: arguments[1] } : undefined);");

fs.writeFileSync(file, code);
