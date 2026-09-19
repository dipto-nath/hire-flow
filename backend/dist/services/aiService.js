import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import OpenAI from 'openai';
const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
});
// ─── Helper Functions ────────────────────────────────────────────────────────────
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
// ─── Core AI Functions ──────────────────────────────────────────────────────────
/**
 * Process uploaded document with AI to extract candidate profile and map to requirements
 */
export async function processDocument(documentId, candidateId, jobId, text, documentType) {
    if (!text || text.length < 100) {
        console.log('Document text too short, skipping AI processing');
        return;
    }
    try {
        const profile = await extractCandidateProfile(text);
        await prisma.candidate.update({
            where: { id: candidateId },
            data: {
                ...profile,
                email: profile.email || candidateId.includes('@') ? profile.email : undefined,
            },
        });
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: { requirements: true },
        });
        if (!job)
            throw new Error('Job not found');
        const matches = await mapCandidateToRequirements(text, job.requirements);
        for (const match of matches) {
            await prisma.evidence.upsert({
                where: { candidateId_requirementId: { candidateId, requirementId: match.requirementId } },
                create: {
                    candidateId,
                    requirementId: match.requirementId,
                    status: match.status,
                    excerpt: match.excerpt,
                    source: documentType,
                    sourceLabel: getSourceLabel(documentType),
                    location: match.location,
                    notes: match.reasoning,
                },
                update: {
                    status: match.status,
                    excerpt: match.excerpt,
                    location: match.location,
                    notes: match.reasoning,
                },
            });
            await createAuditEvent({
                candidateId,
                jobId,
                insight: `Evidence for "${match.requirementId}" mapped as ${match.status}: ${match.excerpt.slice(0, 100)}...`,
                source: documentType,
                sourceLabel: getSourceLabel(documentType),
                action: 'Evidence extracted',
                evidenceTrace: {
                    insight: `Evidence for requirement mapped as ${match.status}`,
                    sourceDocument: documentId,
                    location: match.location,
                    extractedEvidence: match.excerpt,
                    reasoningContext: match.reasoning,
                    requirementId: match.requirementId,
                },
            });
        }
        const groupResult = await determineCandidateGroup(matches);
        await prisma.candidate.update({
            where: { id: candidateId },
            data: {
                group: groupResult.group,
                requirementCoverage: groupResult.requirementCoverage,
                validationNeeded: groupResult.validationNeeded,
            },
        });
        const summary = await generateCandidateSummary(candidateId, text, matches);
        await prisma.candidateSummary.upsert({
            where: { candidateId },
            create: { candidateId, ...summary },
            update: summary,
        });
        console.log(`Document ${documentId} processed successfully for candidate ${candidateId}`);
    }
    catch (error) {
        console.error('Document processing failed:', error);
        throw error;
    }
}
/**
 * Extract structured candidate profile from resume text
 */
async function extractCandidateProfile(text) {
    const prompt = `Extract the following information from this resume text. Return ONLY valid JSON.

Fields to extract:
- name: Full name
- firstName: First name
- lastName: Last name
- email: Email address
- currentRole: Current job title
- currentCompany: Current company
- location: Location (city, state/country)
- yearsExperience: Total years of professional experience (number)
- skills: Array of technical skills (programming languages, frameworks, tools)
- education: Education details (degree, school, year)

Resume text:
${text.slice(0, 15000)}`;
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
    });
    const content = response.choices[0].message.content;
    if (!content)
        throw new Error('No response from OpenAI');
    const parsed = JSON.parse(content);
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
 * Map candidate experience to job requirements
 */
async function mapCandidateToRequirements(resumeText, requirements) {
    const prompt = `You are an expert technical recruiter. Analyze this resume against the job requirements and find evidence for each requirement.

Resume text:
${resumeText.slice(0, 20000)}

Job Requirements:
${requirements.map(r => `- ${r.id} (${r.type}, ${r.category}): ${r.label} - ${r.description || ''}`).join('\n')}

For EACH requirement, return a JSON object with:
- requirementId: The requirement ID
- status: One of "verified" (clear direct evidence), "strong" (strong indirect evidence), "partial" (some evidence but incomplete), "needs_validation" (claims exist but need verification), "not_found" (no evidence)
- excerpt: The specific text from resume that supports this (or "No evidence found")
- reasoning: Brief explanation of why this status was assigned
- location: Where in the resume this was found (e.g., "Experience section - Zenpay 2023-present")

Return as JSON array of objects.`;
    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
    });
    const content = response.choices[0].message.content;
    if (!content)
        throw new Error('No response from OpenAI');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : parsed.matches || [];
}
/**
 * Determine candidate group based on requirement matches
 */
async function determineCandidateGroup(matches) {
    const verifiedCount = matches.filter(m => m.status === 'verified' || m.status === 'strong').length;
    const partialCount = matches.filter(m => m.status === 'partial').length;
    const needsValidationCount = matches.filter(m => m.status === 'needs_validation').length;
    const total = matches.length;
    const coverage = total > 0 ? Math.round(((verifiedCount + partialCount) / total) * 100) : 0;
    let group;
    let reasoning;
    if (verifiedCount >= total * 0.7 && needsValidationCount === 0) {
        group = 'strong_match';
        reasoning = `Strong evidence for ${verifiedCount}/${total} requirements. High confidence match.`;
    }
    else if (verifiedCount + partialCount >= total * 0.5 && needsValidationCount <= 2) {
        group = 'potential_match';
        reasoning = `Good evidence for ${verifiedCount + partialCount}/${total} requirements. Some gaps need validation.`;
    }
    else if (needsValidationCount > 0 || partialCount > 0) {
        group = 'needs_validation';
        reasoning = `${needsValidationCount} requirements need validation, ${partialCount} have partial evidence.`;
    }
    else {
        group = 'insufficient_evidence';
        reasoning = `Only ${verifiedCount}/${total} requirements have evidence. Significant gaps.`;
    }
    return {
        group,
        requirementCoverage: coverage,
        validationNeeded: needsValidationCount > 0 || partialCount > total * 0.3,
        reasoning,
    };
}
/**
 * Generate candidate summary
 */
async function generateCandidateSummary(candidateId, resumeText, matches) {
    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate)
        throw new Error('Candidate not found');
    const prompt = `Generate a structured candidate summary for a recruiter. Be concise but specific.

Candidate: ${candidate.name}
Current Role: ${candidate.currentRole} at ${candidate.currentCompany}
Experience: ${candidate.yearsExperience} years
Skills: ${candidate.skills.join(', ')}

Resume excerpt:
${resumeText.slice(0, 10000)}

Requirement Matches:
${matches.map(m => `- ${m.requirementId}: ${m.status} - ${m.excerpt.slice(0, 200)}`).join('\n')}

Return JSON with these fields:
- overview: 2-3 sentence professional summary
- experience: Summary of relevant experience
- skills: Key technical skills
- projects: Notable projects mentioned
- education: Education background
- domainExperience: Industry/domain experience
- potentialGaps: Areas needing validation or missing experience`;
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
    });
    const content = response.choices[0].message.content;
    if (!content)
        throw new Error('No response from OpenAI');
    return JSON.parse(content);
}
/**
 * Generate interview questions based on candidate gaps
 */
export async function generateInterviewQuestions(candidateId, jobId, focusAreas) {
    const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
            evidence: { include: { requirement: true } },
            summary: true,
        },
    });
    const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { requirements: true },
    });
    if (!candidate || !job)
        throw new Error('Candidate or job not found');
    const needsValidation = candidate.evidence.filter(e => e.status === 'needs_validation' || e.status === 'partial');
    const prompt = `Generate targeted interview questions for this candidate based on their profile and identified gaps.

Candidate: ${candidate.name}
Role: ${candidate.currentRole} at ${candidate.currentCompany}
Experience: ${candidate.yearsExperience} years
Skills: ${candidate.skills.join(', ')}

Requirements needing validation:
${needsValidation.map(e => `
- ${e.requirement.label} (${e.requirement.category}): ${e.excerpt}
  Current status: ${e.status}
`).join('\n')}

Candidate Summary:
${candidate.summary?.overview || 'Not available'}
${candidate.summary?.potentialGaps || ''}

Focus areas: ${focusAreas?.join(', ') || 'All gaps'}

Generate 5-8 specific interview questions that target these gaps. Each question should:
1. Reference the candidate's specific background
2. Target a specific requirement gap
3. Be open-ended to elicit detailed evidence
4. Include what specific evidence to look for

Return as JSON array with fields:
- text: The question
- category: "technical" | "validation" | "experience" | "project" | "behavioral"
- requirementId: The requirement ID this targets
- requirementLabel: The requirement label
- whyAsk: Why this question is important
- evidenceContext: What we already know
- expectedEvidence: What a good answer should contain`;
    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.4,
    });
    const content = response.choices[0].message.content;
    if (!content)
        throw new Error('No response from OpenAI');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : parsed.questions || [];
}
/**
 * Generate follow-up question during live interview
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
    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
    });
    const content = response.choices[0].message.content;
    if (!content)
        throw new Error('No response from OpenAI');
    return JSON.parse(content);
}
//# sourceMappingURL=aiService.js.map