import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
const ai = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
});
// ─── Helper Functions ────────────────────────────────────────────────────────────
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
// Global queue to enforce 12 Requests Per Minute (max 1 request every 5 seconds)
// This keeps us safely below Gemini's 15 RPM free tier limit.
class RequestQueue {
    queue = [];
    processing = false;
    delayMs = 5000; // 5 seconds
    async enqueue(fn) {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    resolve(await fn());
                }
                catch (error) {
                    reject(error);
                }
            });
            if (!this.processing)
                this.process();
        });
    }
    async process() {
        this.processing = true;
        while (this.queue.length > 0) {
            const fn = this.queue.shift();
            if (fn) {
                const start = Date.now();
                await fn();
                const elapsed = Date.now() - start;
                const remainingDelay = this.delayMs - elapsed;
                if (remainingDelay > 0) {
                    await delay(remainingDelay);
                }
            }
        }
        this.processing = false;
    }
}
const globalAiQueue = new RequestQueue();
async function generateWithRetry(prompt, fileData, retries = 3) {
    // Use gemini-3.5-flash-lite for much higher free-tier rate limits (avoids 20/day quota issues)
    const MODEL = 'gemini-3.5-flash-lite';
    for (let i = 0; i < retries; i++) {
        try {
            const parts = [];
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
            // Wrap the AI call in the global queue to throttle requests
            const response = await globalAiQueue.enqueue(async () => {
                return await ai.models.generateContent({
                    model: MODEL,
                    contents: parts,
                    config: {
                        responseMimeType: 'application/json',
                        temperature: 0.2,
                    }
                });
            });
            const responseText = response.text;
            if (!responseText)
                throw new Error('No response from Gemini');
            return JSON.parse(responseText);
        }
        catch (error) {
            console.log(`Gemini Error (attempt ${i + 1}/${retries}):`, error.message?.substring(0, 200));
            if (i === retries - 1)
                throw error;
            // Check for quota exhaustion (daily limit) - don't retry aggressively
            const isQuotaExhausted = error.status === 429 &&
                (error.message?.includes('quota') || error.message?.includes('Quota') || error.message?.includes('limit: 20'));
            if (isQuotaExhausted) {
                console.log('Daily quota exhausted. Waiting 60s before retry...');
                await delay(60000); // Wait 1 minute instead of exponential backoff
            }
            else if (error.status === 429 || error.status === 503 || (error.message && error.message.includes('429'))) {
                const waitMs = Math.min(5000 * Math.pow(2, i), 30000); // Cap at 30s
                console.log(`Rate limited. Waiting ${waitMs}ms before retry...`);
                await delay(waitMs);
            }
            else {
                throw error;
            }
        }
    }
}
function getSourceLabel(type) {
    const labels = {
        resume: 'Resume',
        portfolio: 'Portfolio',
        application: 'Application',
        interview_note: 'Interview Notes',
        interview: 'Interview',
        other: 'Other',
    };
    return labels[type] || 'Document';
}
async function createAuditEvent(data) {
    const candidate = await prisma.candidate.findUnique({ where: { id: data.candidateId } });
    const job = await prisma.job.findUnique({ where: { id: data.jobId } });
    await prisma.auditEvent.create({
        data: {
            candidateId: data.candidateId,
            candidateName: candidate?.name || 'Unknown',
            jobId: data.jobId,
            jobTitle: job?.title,
            insight: data.insight,
            source: data.source,
            sourceLabel: data.sourceLabel,
            generatedBy: 'hireflow',
            action: data.action,
            evidenceTrace: data.evidenceTrace,
        },
    });
}
// ─── Core AI Functions ───────────────────────────────────────────────────────────
/**
 * Process a document (resume, portfolio, etc.) and extract structured candidate profile
 */
export async function processDocument(documentId, candidateId, jobId, filePath, mimeType, documentType) {
    // Extract candidate profile from document
    const profile = await extractCandidateProfile(filePath, mimeType);
    const updateData = {
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
    if (profile.email) {
        updateData.email = profile.email;
    }
    // Update candidate with extracted info
    await prisma.candidate.update({
        where: { id: candidateId },
        data: updateData,
    });
    // Get job requirements
    const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { requirements: true },
    });
    if (!job)
        throw new Error('Job not found');
    // Match requirements against candidate profile
    const matches = await matchRequirements(job.requirements, profile, filePath, mimeType, documentType);
    // Create evidence records
    for (const match of matches) {
        await prisma.evidence.create({
            data: {
                candidateId,
                requirementId: match.requirementId,
                status: match.status,
                excerpt: match.excerpt,
                source: documentType,
                sourceLabel: getSourceLabel(documentType),
                location: match.location,
                notes: match.reasoning,
            },
        });
        const req = job.requirements.find((r) => r.id === match.requirementId);
        // Create audit event
        await createAuditEvent({
            candidateId,
            jobId,
            insight: match.reasoning,
            source: documentType,
            sourceLabel: getSourceLabel(documentType),
            action: 'Extracted evidence against requirement',
            evidenceTrace: {
                insight: match.reasoning,
                sourceDocument: getSourceLabel(documentType),
                location: match.location,
                extractedEvidence: match.excerpt,
                reasoningContext: match.reasoning,
                requirementLabel: req ? req.label : 'Unknown Requirement',
            },
        });
    }
    // Evaluate candidate group
    const groupResult = await evaluateCandidateGroup(candidateId);
    // Update candidate stage and group
    await prisma.candidate.update({
        where: { id: candidateId },
        data: {
            stage: 'screening',
            group: groupResult.group,
            requirementCoverage: groupResult.requirementCoverage,
            validationNeeded: groupResult.validationNeeded,
        },
    });
    // Create audit event for group classification
    await createAuditEvent({
        candidateId,
        jobId,
        insight: groupResult.reasoning,
        source: 'system',
        sourceLabel: 'HireFlow Analysis',
        action: `Classified candidate as ${groupResult.group}`,
    });
    // Generate and save embedding for vector search
    try {
        const summaryText = `Name: ${profile.name}\nRole: ${profile.currentRole}\nCompany: ${profile.currentCompany}\nExperience: ${profile.yearsExperience} years\nSkills: ${profile.skills.join(', ')}\nEducation: ${profile.education}`;
        // Create summary record if it doesn't exist
        const summary = await prisma.candidateSummary.upsert({
            where: { candidateId },
            update: {
                overview: profile.currentRole,
                experience: String(profile.yearsExperience),
                skills: profile.skills.join(', '),
                projects: '',
                education: profile.education,
                domainExperience: '',
                potentialGaps: '',
            },
            create: {
                candidateId,
                overview: profile.currentRole,
                experience: String(profile.yearsExperience),
                skills: profile.skills.join(', '),
                projects: '',
                education: profile.education,
                domainExperience: '',
                potentialGaps: '',
            }
        });
        const embedRes = await ai.models.embedContent({
            model: 'gemini-embedding-001',
            contents: summaryText,
        });
        const embedding = embedRes.embeddings?.[0]?.values;
        if (embedding) {
            await prisma.$executeRaw `UPDATE "CandidateSummary" SET "embedding" = ${embedding}::vector WHERE id = ${summary.id}`;
        }
    }
    catch (error) {
        console.error('Failed to generate embedding for candidate:', error);
    }
}
/**
 * Extract candidate profile from resume file using Gemini
 */
async function extractCandidateProfile(filePath, mimeType) {
    const prompt = `Extract the following information from this resume document. Return as JSON with exact fields.

Return JSON with:
- name: string
- firstName: string
- lastName: string
- email: string
- currentRole: string
- currentCompany: string
- location: string
- yearsExperience: number (total years of professional experience, estimate if necessary)
- skills: string[] (top 15 relevant technical and professional skills)
- education: string (highest degree and institution)

If a field is not found, use empty string or 0 for yearsExperience.`;
    const parsed = await generateWithRetry(prompt, { path: filePath, mimeType });
    return {
        name: parsed.name || '',
        firstName: parsed.firstName || parsed.name?.split(' ')[0] || '',
        lastName: parsed.lastName || parsed.name?.split(' ').slice(1).join(' ') || '',
        email: parsed.email || '',
        currentRole: parsed.currentRole || '',
        currentCompany: parsed.currentCompany || '',
        location: parsed.location || '',
        yearsExperience: parsed.yearsExperience || 0,
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        education: parsed.education || '',
    };
}
/**
 * Match job requirements against candidate profile
 */
async function matchRequirements(requirements, profile, filePath, mimeType, documentType) {
    const prompt = `You are an expert technical recruiter. Analyze this candidate's resume document against the job requirements.

Candidate Profile:
- Name: ${profile.name}
- Role: ${profile.currentRole} at ${profile.currentCompany}
- Location: ${profile.location}
- Experience: ${profile.yearsExperience} years
- Skills: ${profile.skills.join(', ')}
- Education: ${profile.education}

Job Requirements:
${requirements.map(r => `- ${r.id}: ${r.label} (${r.type}, ${r.category})${r.description ? ': ' + r.description : ''}`).join('\n')}

For each requirement, determine:
1. Is there evidence that the candidate meets this requirement?
2. What is the exact excerpt or section in the resume that supports this?
3. What is the status? (verified = explicit evidence, strong = implicit but very likely, partial = meets some aspects, needs_validation = uncertain, not_found = no evidence)

Return a JSON array of objects with fields: requirementId, status, excerpt, reasoning, location (where in the document it was found, e.g. "Experience section", "Skills list")

Return JSON array:
[ { "requirementId": "...", "status": "...", "excerpt": "...", "reasoning": "...", "location": "..." } ]`;
    const parsed = await generateWithRetry(prompt, { path: filePath, mimeType });
    return Array.isArray(parsed) ? parsed : [];
}
/**
 * Evaluate and classify candidate into a group based on requirements
 */
export async function evaluateCandidateGroup(candidateId) {
    const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
            job: { include: { requirements: true } },
            evidence: true,
        },
    });
    if (!candidate)
        throw new Error('Candidate not found');
    const requiredReqs = candidate.job.requirements.filter(r => r.type === 'required');
    const requiredReqIds = requiredReqs.map(r => r.id);
    const evidenceMap = new Map();
    candidate.evidence.forEach(e => {
        if (!evidenceMap.has(e.requirementId) || e.status === 'verified' || e.status === 'strong') {
            evidenceMap.set(e.requirementId, e.status);
        }
    });
    let coveredRequired = 0;
    let validationNeeded = false;
    for (const reqId of requiredReqIds) {
        const status = evidenceMap.get(reqId);
        if (status === 'verified' || status === 'strong') {
            coveredRequired++;
        }
        else if (status === 'partial' || status === 'needs_validation') {
            validationNeeded = true;
        }
    }
    const requirementCoverage = requiredReqIds.length > 0
        ? Math.round((coveredRequired / requiredReqIds.length) * 100)
        : 100;
    let initialGroup = 'insufficient_evidence';
    if (requirementCoverage >= 80 && !validationNeeded) {
        initialGroup = 'strong_match';
    }
    else if (requirementCoverage >= 60) {
        initialGroup = 'potential_match';
    }
    else if (requirementCoverage >= 40 || validationNeeded) {
        initialGroup = 'needs_validation';
    }
    const prompt = `You are a technical recruiter. Review the automated classification of this candidate and provide a short, one-sentence reasoning for this classification.

Candidate: ${candidate.name} (${candidate.currentRole} at ${candidate.currentCompany})
Job: ${candidate.job.title}
Requirements Coverage: ${requirementCoverage}%
Initial Classification: ${initialGroup}
Key Missing/Validation needed requirements: ${requiredReqIds.filter(id => {
        const s = evidenceMap.get(id);
        return !s || s === 'not_found' || s === 'needs_validation' || s === 'partial';
    }).length}

Return JSON with:
- group: "${initialGroup}" (you may override this if the evidence strongly suggests a different group, must be strong_match, potential_match, needs_validation, or insufficient_evidence)
- reasoning: string (one sentence explaining why they are in this group)`;
    const parsed = await generateWithRetry(prompt);
    return {
        group: parsed.group || initialGroup,
        requirementCoverage,
        validationNeeded,
        reasoning: parsed.reasoning || `Automatically classified as ${initialGroup} based on ${requirementCoverage}% requirement coverage.`,
    };
}
/**
 * Generate interview questions based on candidate profile and missing evidence
 */
export async function generateInterviewQuestions(candidateId, jobId, focusAreas) {
    const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
            job: { include: { requirements: true } },
            evidence: { include: { requirement: true } },
        },
    });
    if (!candidate)
        throw new Error('Candidate not found');
    const prompt = `You are an expert technical interviewer preparing questions for a candidate.

Candidate: ${candidate.name} (${candidate.currentRole} at ${candidate.currentCompany})
Experience: ${candidate.yearsExperience} years
Job: ${candidate.job.title}

Job Requirements & Current Evidence:
${candidate.job.requirements.map(req => {
        const evidence = candidate.evidence.find(e => e.requirementId === req.id);
        const status = evidence?.status || 'not_found';
        const excerpt = evidence?.excerpt || 'None';
        return `- ${req.label} (${req.type}): Status: ${status}, Evidence: ${excerpt}`;
    }).join('\n')}

Generate 5-7 highly targeted interview questions. Prioritize:
1. Requirements with 'needs_validation' or 'partial' status
2. Requirements with 'not_found' status
3. Deep-dives into their claimed experience (verified/strong status)

Return as JSON array with fields: text, category (technical, validation, experience, project, behavioral), requirementId (optional), requirementLabel (optional), whyAsk, evidenceContext, expectedEvidence

Return JSON array:
[ { "text": "...", "category": "...", "requirementId": "...", "requirementLabel": "...", "whyAsk": "...", "evidenceContext": "...", "expectedEvidence": "..." } ]`;
    const parsed = await generateWithRetry(prompt);
    return Array.isArray(parsed) ? parsed : [];
}
/**
 * Synthesize interview notes and determine requirement coverage
 */
export async function synthesizeInterview(interviewId) {
    const interview = await prisma.interview.findUnique({
        where: { id: interviewId },
        include: {
            candidate: { include: { evidence: true } },
            job: { include: { requirements: true } },
            notes: { orderBy: { timestamp: 'asc' } },
            questions: true,
        },
    });
    if (!interview)
        throw new Error('Interview not found');
    const prompt = `You are an interview synthesis assistant. Analyze the following interview and produce a structured summary.

Candidate: ${interview.candidate.name} (${interview.candidate.currentRole} at ${interview.candidate.currentCompany})
Job: ${interview.job.title}
Interviewers: ${interview.interviewers.join(', ')}
Interview Date: ${interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleDateString() : 'Not scheduled'}

Job Requirements:
${interview.job.requirements.map(r => `- ${r.label} (${r.type}, ${r.category})`).join('\n')}

Interview Notes:
${interview.notes.map(n => `- ${n.content} (${n.type}, requirement: ${n.requirementLabel || 'general'})`).join('\n')}

Candidate Evidence (from resume):
${interview.candidate.evidence.map(e => `- ${e.requirementId}: ${e.excerpt} [${e.status}]`).join('\n')}

Generate a JSON object with:
- keyEvidence: string[] — Key pieces of evidence from the interview
- requirementCoverage: Array of { requirementId, label, status: "covered" | "partial" | "not_covered" }
- strongEvidence: string[] — Strong positive evidence
- unresolvedQuestions: string[] — Questions that remain unanswered
- contradictions: string[] — Any contradictions between resume and interview
- followUpNeeded: string[] — Areas needing follow-up in future interviews`;
    const parsed = await generateWithRetry(prompt);
    return parsed;
}
/**
 * Generate evaluation report for a candidate
 */
export async function generateEvaluationReport(candidateId, interviewId) {
    const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
            job: { include: { requirements: true } },
            evidence: { include: { requirement: true } },
            interviews: {
                include: { questions: true, notes: true, summary: true },
                where: interviewId ? { id: interviewId } : undefined,
                orderBy: { createdAt: 'desc' },
            },
        },
    });
    if (!candidate)
        throw new Error('Candidate not found');
    const job = candidate.job;
    const latestInterview = candidate.interviews[0];
    const prompt = `You are an evaluation report generator. Create a comprehensive evaluation for a hiring decision.

Candidate: ${candidate.name} (${candidate.currentRole} at ${candidate.currentCompany})
Experience: ${candidate.yearsExperience} years
Job: ${job.title}
Department: ${job.department}

Job Requirements:
${job.requirements.map(r => `- ${r.label} (${r.type}, ${r.category}): ${r.description || ''}`).join('\n')}

Candidate Evidence (from resume):
${candidate.evidence.map(e => `- ${e.requirementId} (${e.requirement.label}): ${e.excerpt} [${e.status}]`).join('\n')}

${latestInterview ? `
Latest Interview (${latestInterview.status}):
Questions: ${latestInterview.questions.map(q => `- ${q.text} (${q.category})`).join('\n')}
Notes: ${latestInterview.notes.map(n => `- ${n.content} (req: ${n.requirementLabel || 'general'})`).join('\n')}
Summary: ${latestInterview.summary ? JSON.stringify(latestInterview.summary) : 'Not available'}
` : 'No interview conducted yet.'}

Generate a JSON object with:
- requirementRows: Array of { requirementId, requirementLabel, evidence, confidence: "high"|"medium"|"low"|"none", status: "verified"|"strong"|"partial"|"needs_validation"|"not_found", source }
- interviewEvidence: string — Summary of interview evidence
- outstandingValidation: string[] — Requirements needing further validation
- overallRating?: "strong_evidence"|"meets_requirements"|"partially_meets"|"needs_more_evidence"|"does_not_meet"
- strengths?: string
- concerns?: string
- additionalValidation?: string
- recommendation?: string`;
    const parsed = await generateWithRetry(prompt);
    return parsed;
}
/**
 * Search candidates using natural language query
 */
export async function searchCandidates(query, jobId, limit = 10) {
    let matchedIds = [];
    try {
        // 1. Embed the search query
        const embedRes = await ai.models.embedContent({
            model: 'gemini-embedding-001',
            contents: query,
        });
        const queryEmbedding = embedRes.embeddings?.[0]?.values;
        if (queryEmbedding) {
            // 2. Perform vector similarity search
            // Using <=> for cosine distance (lower is closer)
            const limitToFetch = limit * 2; // fetch a bit more for LLM filtering
            let rawResults;
            if (jobId) {
                rawResults = await prisma.$queryRaw `
          SELECT s."candidateId", 1 - (s."embedding" <=> ${queryEmbedding}::vector) as similarity
          FROM "CandidateSummary" s
          JOIN "Candidate" c ON s."candidateId" = c.id
          WHERE c."jobId" = ${jobId} AND s."embedding" IS NOT NULL
          ORDER BY s."embedding" <=> ${queryEmbedding}::vector
          LIMIT ${limitToFetch}
        `;
            }
            else {
                rawResults = await prisma.$queryRaw `
          SELECT s."candidateId", 1 - (s."embedding" <=> ${queryEmbedding}::vector) as similarity
          FROM "CandidateSummary" s
          WHERE s."embedding" IS NOT NULL
          ORDER BY s."embedding" <=> ${queryEmbedding}::vector
          LIMIT ${limitToFetch}
        `;
            }
            if (Array.isArray(rawResults)) {
                matchedIds = rawResults.map((r) => r.candidateId);
            }
        }
    }
    catch (err) {
        console.error('Vector search failed, falling back to all candidates:', err);
    }
    const where = {};
    if (jobId)
        where.jobId = jobId;
    if (matchedIds.length > 0)
        where.id = { in: matchedIds };
    const candidates = await prisma.candidate.findMany({
        where,
        include: {
            job: { select: { id: true, title: true, requirements: true } },
            evidence: { include: { requirement: true } },
        },
        take: 20, // Only evaluate top 20 max to save tokens
    });
    if (candidates.length === 0)
        return [];
    const prompt = `
You are an expert technical recruiter AI.
Evaluate which candidates best match the user's natural language search query.
We have already pre-filtered these candidates using vector search, so they are likely good matches.

Query: "${query}"

Candidates:
${candidates.map(c => `ID: ${c.id}\nName: ${c.name}\nRole: ${c.currentRole}\nCompany: ${c.currentCompany}\nExperience: ${c.yearsExperience} years\nSkills: ${c.skills.join(', ')}\nStatus: ${c.interviewStatus}`).join('\n\n')}

Return ONLY a valid JSON array of objects. Do not include markdown formatting like \`\`\`json.
Each object must have:
- id: string
- relevanceScore: number (0-100). Rate highly relevant candidates > 70.
- matchReasons: array of objects with {label: string, source: string, detail: string}. Provide 1-3 reasons why they matched.

Only include candidates with a relevanceScore greater than 40.
  `;
    try {
        const aiResponse = await generateWithRetry(prompt);
        // Ensure we got an array back
        const matchedData = Array.isArray(aiResponse) ? aiResponse : [];
        const results = [];
        for (const match of matchedData) {
            const candidate = candidates.find(c => c.id === match.id);
            if (candidate && match.relevanceScore > 0) {
                results.push({
                    candidate,
                    matchReasons: match.matchReasons || [],
                    relevanceScore: match.relevanceScore
                });
            }
        }
        return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, limit);
    }
    catch (error) {
        console.error('AI Search failed, falling back to basic search:', error);
        // Fallback if AI fails (e.g. quota limit, timeout)
        const lowerQuery = query.toLowerCase();
        const results = candidates.filter(c => c.skills.some(s => lowerQuery.includes(s.toLowerCase())) ||
            (c.currentRole && lowerQuery.includes(c.currentRole.toLowerCase())) ||
            lowerQuery.includes(c.name.toLowerCase())).map(candidate => ({
            candidate,
            matchReasons: [{ label: 'Keyword Match', source: 'Profile', detail: 'Matches search term' }],
            relevanceScore: 50,
        }));
        return results.slice(0, limit);
    }
}
/**
 * Generate follow-up questions during an interview
 */
export async function generateFollowUp(interviewId, noteContent, requirementLabel, requirementId) {
    const interview = await prisma.interview.findUnique({
        where: { id: interviewId },
        include: {
            candidate: { include: { evidence: { include: { requirement: true } } } },
            notes: { orderBy: { timestamp: 'desc' }, take: 5 },
        },
    });
    if (!interview)
        throw new Error('Interview not found');
    const prompt = `You are an interview assistant. A recruiter just took this note during an interview:

Note: "${noteContent}"
Requirement being assessed: ${requirementLabel}
Candidate: ${interview.candidate.name} (${interview.candidate.currentRole} at ${interview.candidate.currentCompany})

Recent notes:
${interview.notes.slice(0, 3).map(n => `- ${n.content}`).join('\n')}

Does this note fully validate the requirement? If not, generate ONE specific follow-up question to dig deeper.

Return JSON with:
- question: The follow-up question
- why: Why this follow-up is needed
- whatToValidate: What specific evidence to look for
- requirementId: "${requirementId || ''}"
- requirementLabel: "${requirementLabel}"`;
    const parsed = await generateWithRetry(prompt);
    return parsed;
}
/**
 * Generate Interview Prep Questions
 */
export async function generateInterviewPrep(candidateId, jobId, numQuestions = 5) {
    const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
            evidence: { include: { requirement: true } }
        },
    });
    const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { requirements: true }
    });
    if (!candidate || !job)
        throw new Error('Candidate or Job not found');
    const gaps = candidate.evidence.filter(e => e.status === 'not_found' || e.status === 'needs_validation');
    const prompt = `You are an expert technical interviewer preparing a ${numQuestions}-question interview plan.
Candidate: ${candidate.name}
Job: ${job.title}

Job Requirements:
${job.requirements.map(r => `- ${r.label} (${r.type})`).join('\n')}

Identified Gaps / Needs Validation:
${gaps.map(g => `- Requirement: ${g.requirement?.label}\n  Context: ${g.excerpt}`).join('\n')}

Generate exactly ${numQuestions} highly targeted interview questions. Focus heavily on validating the identified gaps.
For each question, return JSON with:
- text: The question to ask
- category: One of "technical", "experience", "validation", "behavioral", "project"
- requirementId: The ID of the requirement being tested (use the closest matching requirement ID if applicable)
- requirementLabel: The label of the requirement
- whyAsk: Why this question is important based on the candidate's gaps or resume
- evidenceContext: What the resume says (or is missing) about this
- expectedEvidence: What a good answer should include

Only return a valid JSON array of objects. Do not include markdown formatting.`;
    const parsed = await generateWithRetry(prompt);
    const questionsData = Array.isArray(parsed) ? parsed : [];
    return questionsData.map((q) => ({
        ...q,
        // ensure IDs match if possible
        requirementId: job.requirements.find(r => r.label === q.requirementLabel)?.id || null
    }));
}
//# sourceMappingURL=aiService.js.map