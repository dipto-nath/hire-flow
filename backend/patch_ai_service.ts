import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/services/aiService.ts');
let content = fs.readFileSync(file, 'utf8');

// 1. Add fs import if missing
if (!content.includes(`import fs from 'fs';`)) {
  content = content.replace(`import { GoogleGenAI } from '@google/genai';`, `import { GoogleGenAI } from '@google/genai';\nimport fs from 'fs';`);
}

// 2. Add delay helper
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
          temperature: 0.2, // unified temp
        }
      });
      
      const responseText = response.text;
      if (!responseText) throw new Error('No response from Gemini');
      
      return JSON.parse(responseText);
    } catch (error: any) {
      console.log(\`Gemini Error (attempt \${i+1}):\`, error.message);
      if (i === retries - 1) throw error;
      if (error.status === 429 || error.status === 503 || error.message.includes('429')) {
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

if (!content.includes('generateWithRetry')) {
  content = content.replace('// ─── Type Definitions', delayHelper + '\n// ─── Type Definitions');
}

// 3. Update processDocument signature
content = content.replace(
  `export async function processDocument(
  documentId: string,
  candidateId: string,
  jobId: string,
  text: string,
  documentType: string
) {
  // Extract candidate profile from document
  const profile = await extractCandidateProfile(text);`,
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

// 4. Update matchRequirements call
content = content.replace(
  `const matches = await matchRequirements(job.requirements, profile, text, documentType);`,
  `const matches = await matchRequirements(job.requirements, profile, filePath, mimeType, documentType);`
);

// 5. Update mapCandidateToRequirements
content = content.replace(
  `await processDocument(resumeDoc.id, candidateId, jobId, resumeDoc.extractedText, 'resume');`,
  `await processDocument(resumeDoc.id, candidateId, jobId, resumeDoc.filePath!, 'application/pdf', 'resume');`
);

// 6. Update extractCandidateProfile
content = content.replace(
  `async function extractCandidateProfile(text: string): Promise<ExtractedCandidateProfile> {
  const prompt = \`Extract the following information from this resume text. Return as JSON with exact fields.

Resume text:
\${text.slice(0, 15000)}

Return JSON with:\`;`,
  `async function extractCandidateProfile(filePath: string, mimeType: string): Promise<ExtractedCandidateProfile> {
  const prompt = \`Extract the following information from this resume document. Return as JSON with exact fields.

Return JSON with:\`;`
);

content = content.replace(
  /const response = await ai\.models\.generateContent\(\{[\s\S]*?const parsed = JSON\.parse\(content\);/m,
  `const parsed = await generateWithRetry('gemini-3.5-flash', prompt, { path: filePath, mimeType });`
);

// 7. Update matchRequirements signature
content = content.replace(
  `async function matchRequirements(
  requirements: Array<{ id: string; label: string; type: string; category: string; description?: string | null }>,
  profile: ExtractedCandidateProfile,
  text: string,
  documentType: string
): Promise<RequirementMatch[]> {
  const prompt = \`You are an expert technical recruiter. Analyze this candidate's profile against the job requirements.

Candidate Profile:
- Name: \${profile.name}
- Role: \${profile.currentRole} at \${profile.currentCompany}
- Location: \${profile.location}
- Experience: \${profile.yearsExperience} years
- Skills: \${profile.skills.join(', ')}
- Education: \${profile.education}

Job Requirements:
\${requirements.map(r => \`- \${r.id}: \${r.label} (\${r.type}, \${r.category})\${r.description ? ': ' + r.description : ''}\`).join('\\n')}

Full Resume Text:
\${text.slice(0, 15000)}

For each requirement, determine:\`;`,
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

For each requirement, determine:\`;`
);

content = content.replace(
  /const response = await ai\.models\.generateContent\(\{[\s\S]*?const parsed = JSON\.parse\(content\);/m,
  `const parsed = await generateWithRetry('gemini-3.5-flash', prompt, { path: filePath, mimeType });`
);

// 8. Make sure other ai queries use the retry mechanism
content = content.replace(
  /const response = await ai\.models\.generateContent\(\{[\s\S]*?const summary = JSON\.parse\(content\);/m,
  `const summary = await generateWithRetry('gemini-3.5-flash', prompt);`
);

content = content.replace(
  /const response = await ai\.models\.generateContent\(\{[\s\S]*?const parsed = JSON\.parse\(content\);/m,
  `const parsed = await generateWithRetry('gemini-3.5-flash', prompt);`
);

fs.writeFileSync(file, content);
console.log('Patch complete');
