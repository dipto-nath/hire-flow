import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/services/aiService.ts');
let content = fs.readFileSync(file, 'utf8');

// Add fs import
if (!content.includes("import fs from 'fs';")) {
  content = content.replace("import { GoogleGenAI } from '@google/genai';", "import { GoogleGenAI } from '@google/genai';\nimport fs from 'fs';");
}

// Add delay helper
const delayHelper = `
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateWithRetry(model: string, prompt: string, fileData?: { path: string, mimeType: string }, retries = 3): Promise<any> {
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
        model,
        contents: parts,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
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
  return null;
}
`;

if (!content.includes('generateWithRetry')) {
  content = content.replace('// ─── Type Definitions', delayHelper + '\n// ─── Type Definitions');
}

// processDocument
content = content.replace(
  /export async function processDocument\([\s\S]*?text: string,[\s\S]*?\) \{[\s\S]*?const profile = await extractCandidateProfile\(text\);/m,
  `export async function processDocument(
  documentId: string,
  candidateId: string,
  jobId: string,
  filePath: string,
  mimeType: string,
  documentType: string
) {
  // Extract candidate profile from document
  const profile = await extractCandidateProfile(filePath, mimeType);`
);

content = content.replace(
  `const matches = await matchRequirements(job.requirements, profile, text, documentType);`,
  `const matches = await matchRequirements(job.requirements, profile, filePath, mimeType, documentType);`
);

content = content.replace(
  `await processDocument(resumeDoc.id, candidateId, jobId, resumeDoc.extractedText, 'resume');`,
  `await processDocument(resumeDoc.id, candidateId, jobId, resumeDoc.filePath!, 'application/pdf', 'resume');`
);

// extractCandidateProfile
content = content.replace(
  /async function extractCandidateProfile\(text: string\): Promise<ExtractedCandidateProfile> \{[\s\S]*?Resume text:\n\$\{text\.slice\(0, 15000\)\}\n\nReturn JSON with:/m,
  `async function extractCandidateProfile(filePath: string, mimeType: string): Promise<ExtractedCandidateProfile> {
  const prompt = \`Extract the following information from this resume document. Return as JSON with exact fields.

Return JSON with:`
);

content = content.replace(
  /const response = await ai\.models\.generateContent\(\{[\s\S]*?model: 'gemini-3.5-flash',[\s\S]*?contents: prompt,[\s\S]*?config: \{[\s\S]*?responseMimeType: 'application\/json',[\s\S]*?temperature: 0.1,[\s\S]*?\}[\s\S]*?\}\);[\s\S]*?const content = response\.text;[\s\S]*?if \(!content\) throw new Error\('No response from Gemini'\);[\s\S]*?const parsed = JSON\.parse\(content\);/m,
  `const parsed = await generateWithRetry('gemini-3.5-flash', prompt, { path: filePath, mimeType });`
);

// matchRequirements
content = content.replace(
  /async function matchRequirements\([\s\S]*?profile: ExtractedCandidateProfile,[\s\S]*?text: string,[\s\S]*?documentType: string[\s\S]*?\)[\s\S]*?Job Requirements:\n\$\{requirements\.map[\s\S]*?\}\)\.join\('\\n'\)\}\n\nFull Resume Text:\n\$\{text\.slice\(0, 15000\)\}\n\nFor each requirement, determine:/m,
  `async function matchRequirements(
  requirements: Array<{ id: string; label: string; type: string; category: string; description?: string | null }>,
  profile: ExtractedCandidateProfile,
  filePath: string,
  mimeType: string,
  documentType: string
): Promise<RequirementMatch[]> {
  const prompt = \`You are an expert technical recruiter. Analyze this candidate's resume document against the job requirements.

Candidate Profile:
- Name: \${profile.name}
- Role: \${profile.currentRole} at \${profile.currentCompany}
- Location: \${profile.location}
- Experience: \${profile.yearsExperience} years
- Skills: \${profile.skills.join(', ')}
- Education: \${profile.education}

Job Requirements:
\${requirements.map(r => \`- \${r.id}: \${r.label} (\${r.type}, \${r.category})\${r.description ? ': ' + r.description : ''}\`).join('\\n')}

For each requirement, determine:`
);

content = content.replace(
  /const response = await ai\.models\.generateContent\(\{[\s\S]*?model: 'gemini-3.5-flash',[\s\S]*?contents: prompt,[\s\S]*?config: \{[\s\S]*?responseMimeType: 'application\/json',[\s\S]*?temperature: 0.2,[\s\S]*?\}[\s\S]*?\}\);[\s\S]*?const content = response\.text;[\s\S]*?if \(!content\) throw new Error\('No response from Gemini'\);[\s\S]*?const parsed = JSON\.parse\(content\);/m,
  `const parsed = await generateWithRetry('gemini-3.5-flash', prompt, { path: filePath, mimeType });`
);

// evaluateCandidateGroup
content = content.replace(
  /const response = await ai\.models\.generateContent\(\{[\s\S]*?model: 'gemini-3.5-flash',[\s\S]*?contents: prompt,[\s\S]*?config: \{[\s\S]*?responseMimeType: 'application\/json',[\s\S]*?temperature: 0.1,[\s\S]*?\}[\s\S]*?\}\);[\s\S]*?const content = response\.text;[\s\S]*?if \(!content\) throw new Error\('No response from Gemini'\);[\s\S]*?const parsed = JSON\.parse\(content\);/m,
  `const parsed = await generateWithRetry('gemini-3.5-flash', prompt);`
);

// generateInterviewQuestions
content = content.replace(
  /const response = await ai\.models\.generateContent\(\{[\s\S]*?model: 'gemini-3.5-flash',[\s\S]*?contents: prompt,[\s\S]*?config: \{[\s\S]*?responseMimeType: 'application\/json',[\s\S]*?temperature: 0.3,[\s\S]*?\}[\s\S]*?\}\);[\s\S]*?const content = response\.text;[\s\S]*?if \(!content\) throw new Error\('No response from Gemini'\);[\s\S]*?const parsed = JSON\.parse\(content\);/m,
  `const parsed = await generateWithRetry('gemini-3.5-flash', prompt);`
);

// suggestFollowUpQuestions
content = content.replace(
  /const response = await ai\.models\.generateContent\(\{[\s\S]*?model: 'gemini-3.5-flash',[\s\S]*?contents: prompt,[\s\S]*?config: \{[\s\S]*?responseMimeType: 'application\/json',[\s\S]*?temperature: 0.2,[\s\S]*?\}[\s\S]*?\}\);[\s\S]*?const content = response\.text;[\s\S]*?if \(!content\) throw new Error\('No response from Gemini'\);[\s\S]*?const parsed = JSON\.parse\(content\);/m,
  `const parsed = await generateWithRetry('gemini-3.5-flash', prompt);`
);

// synthesizeInterview
content = content.replace(
  /const response = await ai\.models\.generateContent\(\{[\s\S]*?model: 'gemini-3.5-flash',[\s\S]*?contents: prompt,[\s\S]*?config: \{[\s\S]*?responseMimeType: 'application\/json',[\s\S]*?temperature: 0.3,[\s\S]*?\}[\s\S]*?\}\);[\s\S]*?const synthesisContent = response\.text;[\s\S]*?if \(!synthesisContent\) throw new Error\('No response from Gemini'\);[\s\S]*?return JSON\.parse\(synthesisContent\);/m,
  `const parsed = await generateWithRetry('gemini-3.5-flash', prompt);\n  return parsed;`
);

// generateEvaluationReport
content = content.replace(
  /const response = await ai\.models\.generateContent\(\{[\s\S]*?model: 'gemini-3.5-flash',[\s\S]*?contents: prompt,[\s\S]*?config: \{[\s\S]*?responseMimeType: 'application\/json',[\s\S]*?temperature: 0.2,[\s\S]*?\}[\s\S]*?\}\);[\s\S]*?const evalContent = response\.text;[\s\S]*?if \(!evalContent\) throw new Error\('No response from Gemini'\);[\s\S]*?return JSON\.parse\(evalContent\);/m,
  `const parsed = await generateWithRetry('gemini-3.5-flash', prompt);\n  return parsed;`
);

fs.writeFileSync(file, content);
console.log('Patch complete');
