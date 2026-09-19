import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// ─── Type Definitions ──────────────────────────────────────────────────────────

interface ExtractedCandidateProfile {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  currentRole: string;
  currentCompany: string;
  location: string;
  yearsExperience: number;
  skills: string[];
  education: string;
}

interface RequirementMatch {
  requirementId: string;
  status: 'verified' | 'strong' | 'partial' | 'needs_validation' | 'not_found';
  excerpt: string;
  reasoning: string;
  location: string;
}

interface CandidateGroupResult {
  group: 'strong_match' | 'potential_match' | 'needs_validation' | 'insufficient_evidence';
  requirementCoverage: number;
  validationNeeded: boolean;
  reasoning: string;
}

interface InterviewQuestion {
  text: string;
  category: 'technical' | 'validation' | 'experience' | 'project' | 'behavioral';
  requirementId?: string;
  requirementLabel?: string;
  whyAsk: string;
  evidenceContext: string;
  expectedEvidence: string;
}

interface FollowUpSuggestion {
  question: string;
  why: string;
  whatToValidate: string;
  requirementId?: string;
  requirementLabel?: string;
}

interface InterviewSynthesis {
  keyEvidence: string[];
  requirementCoverage: { requirementId: string; label: string; status: 'covered' | 'partial' | 'not_covered' }[];
  strongEvidence: string[];
  unresolvedQuestions: string[];
  contradictions: string[];
  followUpNeeded: string[];
}

interface EvaluationReport {
  requirementRows: {
    requirementId: string;
    requirementLabel: string;
    evidence: string;
    confidence: 'high' | 'medium' | 'low' | 'none';
    status: 'verified' | 'strong' | 'partial' | 'needs_validation' | 'not_found';
    source: string;
  }[];
  interviewEvidence: string;
  outstandingValidation: string[];
  overallRating?: 'strong_evidence' | 'meets_requirements' | 'partially_meets' | 'needs_more_evidence' | 'does_not_meet';
  strengths?: string;
  concerns?: string;
  additionalValidation?: string;
  recommendation?: string;
}

interface SearchMatchReason {
  label: string;
  source: string;
  detail: string;
}

// ─── Helper Functions ────────────────────────────────────────────────────────────

function getSourceLabel(type: string): string {
  const labels: Record<string, string> = {
    resume: 'Resume',
    portfolio: 'Portfolio',
    application: 'Application',
    interview_note: 'Interview Notes',
    interview: 'Interview',
    other: 'Other',
  };
  return labels[type] || 'Document';
}

async function createAuditEvent(data: {
  candidateId: string;
  jobId: string;
  insight: string;
  source: 'resume' | 'portfolio' | 'application' | 'interview' | 'manual' | 'system';
  sourceLabel: string;
  action: string;
  evidenceTrace?: any;
}) {
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
export async function processDocument(
  documentId: string,
  candidateId: string,
  jobId: string,
  text: string,
  documentType: string
) {
  // Extract candidate profile from document
  const profile = await extractCandidateProfile(text);

  // Update candidate with extracted info
  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      name: profile.name,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      currentRole: profile.currentRole,
      currentCompany: profile.currentCompany,
      location: profile.location,
      yearsExperience: profile.yearsExperience,
      skills: profile.skills,
      education: profile.education,
    },
  });

  // Get job requirements
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { requirements: true },
  });

  if (!job) throw new Error('Job not found');

  // Match requirements against candidate profile
  const matches = await matchRequirements(job.requirements, profile, text, documentType);

  // Create evidence records
  for (const match of matches) {
    await prisma.evidence.create({
      data: {
        candidateId,
        requirementId: match.requirementId,
        status: match.status,
        excerpt: match.excerpt,
        source: documentType as any,
        sourceLabel: getSourceLabel(documentType),
        location: match.location,
        notes: match.reasoning,
      },
    });

    // Create audit event
    await createAuditEvent({
      candidateId,
      jobId,
      insight: match.reasoning,
      source: documentType as any,
      sourceLabel: getSourceLabel(documentType),
      action: 'Evidence extracted',
      evidenceTrace: {
        insight: match.reasoning,
        sourceDocument: documentType,
        location: match.location,
        extractedEvidence: match.excerpt,
        reasoningContext: match.reasoning,
        requirementId: match.requirementId,
        requirementLabel: job.requirements.find(r => r.id === match.requirementId)?.label,
      },
    });
  }

  // Calculate group and coverage
  const { group, requirementCoverage, validationNeeded } = calculateGroupAndCoverage(matches);

  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      group,
      requirementCoverage,
      validationNeeded,
      stage: 'screening',
    },
  });

  // Create summary
  await createCandidateSummary(candidateId, profile, matches);
}

/**
 * Extract candidate profile from resume text using OpenAI
 */
async function extractCandidateProfile(text: string): Promise<ExtractedCandidateProfile> {
  const prompt = `Extract the following information from this resume text. Return as JSON with exact fields.

Resume text:
${text.slice(0, 15000)}

Return JSON with:
- name: Full name
- firstName: First name
- lastName: Last name
- email: Email address
- currentRole: Current/most recent job title
- currentCompany: Current/most recent company
- location: Location (city, state/country)
- yearsExperience: Total years of professional experience (number)
- skills: Array of technical skills (strings)
- education: Education summary

If a field is not found, use empty string or 0 for yearsExperience.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No response from OpenAI');

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
 * Match job requirements against candidate profile
 */
async function matchRequirements(
  requirements: Array<{ id: string; label: string; type: string; category: string; description?: string | null }>,
  profile: ExtractedCandidateProfile,
  text: string,
  documentType: string
): Promise<RequirementMatch[]> {
  const prompt = `You are an expert technical recruiter. Analyze this candidate's profile against the job requirements.

Candidate Profile:
- Name: ${profile.name}
- Role: ${profile.currentRole} at ${profile.currentCompany}
- Location: ${profile.location}
- Experience: ${profile.yearsExperience} years
- Skills: ${profile.skills.join(', ')}
- Education: ${profile.education}

Job Requirements:
${requirements.map(r => `- ${r.id}: ${r.label} (${r.type}, ${r.category})${r.description ? ': ' + r.description : ''}`).join('\n')}

Full Resume Text:
${text.slice(0, 15000)}

For each requirement, determine:
1. status: "verified" | "strong" | "partial" | "needs_validation" | "not_found"
2. excerpt: The specific text from resume that supports this (max 200 chars)
3. reasoning: Brief explanation of the match
4. location: Where in the resume this was found (e.g., "Experience section", "Skills section")

Return as JSON array with fields: requirementId, status, excerpt, reasoning, location`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No response from OpenAI');

  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : parsed.matches || [];
}

/**
 * Calculate candidate group and coverage based on requirement matches
 */
function calculateGroupAndCoverage(matches: RequirementMatch[]): CandidateGroupResult {
  const required = matches.filter(m => {
    const req = matches.find(r => r.requirementId === m.requirementId);
    return true; // We'll determine from job requirements
  });

  const verifiedCount = matches.filter(m => m.status === 'verified').length;
  const strongCount = matches.filter(m => m.status === 'strong').length;
  const partialCount = matches.filter(m => m.status === 'partial').length;
  const needsValidationCount = matches.filter(m => m.status === 'needs_validation').length;
  const notFoundCount = matches.filter(m => m.status === 'not_found').length;
  const total = matches.length;

  const requirementCoverage = total > 0 
    ? Math.round(((verifiedCount + strongCount + partialCount * 0.5) / total) * 100)
    : 0;

  const validationNeeded = needsValidationCount > 0 || partialCount > 0;

  let group: CandidateGroupResult['group'];
  if (verifiedCount + strongCount >= total * 0.7 && notFoundCount === 0) {
    group = 'strong_match';
  } else if (verifiedCount + strongCount + partialCount >= total * 0.5) {
    group = 'potential_match';
  } else if (needsValidationCount + partialCount > 0) {
    group = 'needs_validation';
  } else {
    group = 'insufficient_evidence';
  }

  return { group, requirementCoverage, validationNeeded, reasoning: '' };
}

/**
 * Create candidate summary
 */
async function createCandidateSummary(
  candidateId: string,
  profile: ExtractedCandidateProfile,
  matches: RequirementMatch[]
) {
  const gaps = matches
    .filter(m => m.status === 'needs_validation' || m.status === 'partial' || m.status === 'not_found')
    .map(m => m.requirementId)
    .join(', ');

  const prompt = `Write a professional candidate summary for a recruiter.

Candidate: ${profile.name}
Role: ${profile.currentRole} at ${profile.currentCompany}
Experience: ${profile.yearsExperience} years
Skills: ${profile.skills.join(', ')}
Education: ${profile.education}

Requirement gaps: ${gaps || 'None identified'}

Write a concise overview (2-3 sentences), experience summary, skills, projects, education, domain experience, and potential gaps.
Return JSON with: overview, experience, skills, projects, education, domainExperience, potentialGaps`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0].message.content;
  if (!content) return;

  const summary = JSON.parse(content);

  await prisma.candidateSummary.upsert({
    where: { candidateId },
    create: { candidateId, ...summary },
    update: summary,
  });
}

/**
 * Map candidate to job requirements - used by /api/ai/map-candidate
 */
export async function mapCandidateToRequirements(candidateId: string, jobId: string) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { documents: true },
  });

  if (!candidate) throw new Error('Candidate not found');

  const resumeDoc = candidate.documents.find(d => d.type === 'resume' && d.extractedText);
  if (!resumeDoc || !resumeDoc.extractedText) throw new Error('No resume text available');

  await processDocument(resumeDoc.id, candidateId, jobId, resumeDoc.extractedText, 'resume');

  return { success: true };
}

/**
 * Generate interview questions for a candidate
 */
export async function generateInterviewQuestions(
  candidateId: string,
  jobId: string,
  focusAreas?: string[]
): Promise<InterviewQuestion[]> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      job: { include: { requirements: true } },
      evidence: { include: { requirement: true } },
      summary: true,
    },
  });

  if (!candidate) throw new Error('Candidate not found');

  const needsValidation = candidate.evidence.filter(
    e => e.status === 'needs_validation' || e.status === 'partial'
  );

  const prompt = `Generate targeted interview questions for this candidate based on their profile and identified gaps.

Candidate: ${candidate.name}
Role: ${candidate.currentRole} at ${candidate.currentCompany}
Experience: ${candidate.yearsExperience} years
Skills: ${candidate.skills.join(', ')}

Requirements needing validation:
${needsValidation.map(e => `\n- ${e.requirement.label} (${e.requirement.category}): ${e.excerpt}\n  Current status: ${e.status}`).join('\n')}

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
  if (!content) throw new Error('No response from OpenAI');

  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : parsed.questions || [];
}

/**
 * Generate follow-up question during live interview
 */
export async function generateFollowUp(
  interviewId: string,
  noteContent: string,
  requirementLabel: string,
  requirementId?: string
): Promise<FollowUpSuggestion> {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      candidate: { include: { evidence: { include: { requirement: true } } } },
      notes: { orderBy: { timestamp: 'desc' }, take: 5 },
    },
  });

  if (!interview) throw new Error('Interview not found');

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
  if (!content) throw new Error('No response from OpenAI');

  return JSON.parse(content);
}

/**
 * Synthesize interview notes into a structured summary
 */
export async function synthesizeInterview(
  interviewId: string
): Promise<InterviewSynthesis> {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      candidate: { include: { evidence: { include: { requirement: true } } } },
      job: { include: { requirements: true } },
      notes: { orderBy: { timestamp: 'asc' } },
      questions: true,
    },
  });

  if (!interview) throw new Error('Interview not found');

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

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const synthesisContent = response.choices[0].message.content;
  if (!synthesisContent) throw new Error('No response from OpenAI');

  return JSON.parse(synthesisContent);
}

/**
 * Generate evaluation report for a candidate
 */
export async function generateEvaluationReport(
  candidateId: string,
  interviewId?: string
): Promise<EvaluationReport> {
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

  if (!candidate) throw new Error('Candidate not found');

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

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  const evalContent = response.choices[0].message.content;
  if (!evalContent) throw new Error('No response from OpenAI');

  return JSON.parse(evalContent);
}

/**
 * Search candidates using natural language query
 */
export async function searchCandidates(
  query: string,
  jobId?: string,
  limit: number = 10
): Promise<Array<{
  candidate: any;
  matchReasons: Array<{ label: string; source: string; detail: string }>;
  relevanceScore: number;
}>> {
  const where: any = {};
  if (jobId) where.jobId = jobId;

  const candidates = await prisma.candidate.findMany({
    where,
    include: {
      job: { select: { id: true, title: true, requirements: true } },
      evidence: { include: { requirement: true } },
    },
    take: 100,
  });

  const lowerQuery = query.toLowerCase();
  const results: Array<{
    candidate: any;
    matchReasons: Array<{ label: string; source: string; detail: string }>;
    relevanceScore: number;
  }> = [];

  for (const candidate of candidates) {
    const matchReasons: Array<{ label: string; source: string; detail: string }> = [];
    let score = 0;

    // Skill matching
    candidate.skills.forEach(skill => {
      if (lowerQuery.includes(skill.toLowerCase())) {
        matchReasons.push({ label: skill, source: 'Resume', detail: 'Listed as a primary skill' });
        score += 25;
      }
    });

    // Experience matching
    const yearMatch = lowerQuery.match(/(\d+)\+?\s*years?/);
    if (yearMatch) {
      const requiredYears = parseInt(yearMatch[1]);
      if (candidate.yearsExperience >= requiredYears) {
        matchReasons.push({
          label: `${candidate.yearsExperience} years experience`,
          source: 'Resume',
          detail: `Meets the ${requiredYears}+ year requirement`,
        });
        score += 20;
      }
    }

    // Domain/industry matching
    if (lowerQuery.includes('fintech') || lowerQuery.includes('finance')) {
      const fintechCompanies = ['Zenpay', 'N26', 'Razorpay', 'Flutterwave', 'Klarna', 'Stripe', 'PayPal'];
      if (candidate.currentCompany && fintechCompanies.some(c => candidate.currentCompany!.includes(c))) {
        matchReasons.push({ label: 'Fintech experience', source: 'Resume', detail: `Works at ${candidate.currentCompany}` });
        score += 30;
      }
    }

    // Missing requirement / validation needed
    if (lowerQuery.includes('missing') || lowerQuery.includes('needs validation')) {
      if (candidate.validationNeeded) {
        matchReasons.push({ label: 'Needs validation', source: 'HireFlow Analysis', detail: 'Has unresolved requirements' });
        score += 15;
      }
    }

    // Interview status
    if (lowerQuery.includes('interview')) {
      if (candidate.interviewStatus === 'completed' || candidate.interviewStatus === 'scheduled') {
        matchReasons.push({ label: `Interview ${candidate.interviewStatus}`, source: 'Interview records', detail: `Interview status: ${candidate.interviewStatus}` });
        score += 20;
      }
    }

    // Strong match bonus
    if (candidate.group === 'strong_match') score += 10;

    if (matchReasons.length > 0 || score > 0) {
      results.push({ candidate, matchReasons, relevanceScore: Math.min(score, 100) });
    }
  }

  // If no specific matches, return some candidates
  if (results.length === 0) {
    return candidates.slice(0, limit).map(candidate => ({
      candidate,
      matchReasons: [{ label: candidate.skills[0] ?? 'General match', source: 'Resume', detail: 'Candidate in active pool' }],
      relevanceScore: 30,
    }));
  }

  return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, limit);
}
