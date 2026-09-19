import { z } from 'zod';

// ─── Job Schemas ────────────────────────────────────────────────────────────────

export const requirementSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['required', 'preferred']),
  category: z.enum(['skill', 'experience', 'education', 'domain', 'other']),
  label: z.string().min(1).max(200),
  description: z.string().optional(),
});

export const createJobSchema = z.object({
  title: z.string().min(1).max(200),
  department: z.string().min(1).max(100),
  location: z.string().min(1).max(200),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'internship']),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']),
  description: z.string().min(1),
  requirements: z.array(requirementSchema).min(1),
  status: z.enum(['active', 'draft', 'closed', 'paused']).default('draft'),
});

export const updateJobSchema = createJobSchema.partial();

export const jobParamsSchema = z.object({
  id: z.string().uuid(),
});

// ─── Candidate Schemas ──────────────────────────────────────────────────────────

export const createCandidateSchema = z.object({
  jobId: z.string().uuid(),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  currentRole: z.string().optional(),
  currentCompany: z.string().optional(),
  location: z.string().optional(),
  yearsExperience: z.number().int().min(0).default(0),
  skills: z.array(z.string()).default([]),
  education: z.string().optional(),
  stage: z.enum(['applied', 'screening', 'interview', 'evaluation', 'decision']).default('applied'),
});

export const updateCandidateSchema = createCandidateSchema.partial().omit({ jobId: true });

export const candidateParamsSchema = z.object({
  id: z.string().uuid(),
});

export const moveStageSchema = z.object({
  stage: z.enum(['applied', 'screening', 'interview', 'evaluation', 'decision']),
});

export const overrideGroupSchema = z.object({
  group: z.enum(['strong_match', 'potential_match', 'needs_validation', 'insufficient_evidence']),
});

// ─── Interview Schemas ──────────────────────────────────────────────────────────

export const interviewQuestionSchema = z.object({
  text: z.string().min(1),
  category: z.enum(['technical', 'validation', 'experience', 'project', 'behavioral']),
  requirementId: z.string().uuid().optional(),
  requirementLabel: z.string().optional(),
  whyAsk: z.string().optional(),
  evidenceContext: z.string().optional(),
  expectedEvidence: z.string().optional(),
  addedToInterview: z.boolean().default(true),
});

export const createInterviewSchema = z.object({
  candidateId: z.string().uuid(),
  jobId: z.string().uuid(),
  scheduledAt: z.string().datetime().optional(),
  interviewers: z.array(z.string()).default([]),
  questions: z.array(interviewQuestionSchema).default([]),
});

export const updateInterviewSchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  scheduledAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  interviewers: z.array(z.string()).optional(),
});

export const interviewNoteSchema = z.object({
  questionId: z.string().uuid().optional(),
  questionText: z.string().optional(),
  content: z.string().min(1),
  requirementId: z.string().uuid().optional(),
  requirementLabel: z.string().optional(),
  flaggedForFollowUp: z.boolean().default(false),
  type: z.enum(['evidence', 'note', 'follow_up']).default('note'),
});

export const interviewParamsSchema = z.object({
  id: z.string().uuid(),
});

// ─── AI Schemas ─────────────────────────────────────────────────────────────────

export const mapCandidateSchema = z.object({
  candidateId: z.string().uuid(),
  jobId: z.string().uuid(),
});

export const generateQuestionsSchema = z.object({
  candidateId: z.string().uuid(),
  jobId: z.string().uuid(),
  focusAreas: z.array(z.string()).optional(),
});

export const generateFollowUpSchema = z.object({
  interviewId: z.string().uuid(),
  noteContent: z.string().min(1),
  requirementLabel: z.string(),
  requirementId: z.string().uuid().optional(),
});

export const synthesizeInterviewSchema = z.object({
  interviewId: z.string().uuid(),
});

export const generateEvaluationSchema = z.object({
  candidateId: z.string().uuid(),
  interviewId: z.string().uuid().optional(),
});

// ─── Search Schemas ─────────────────────────────────────────────────────────────

export const searchSchema = z.object({
  query: z.string().min(1),
  jobId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

// ─── Audit Schemas ──────────────────────────────────────────────────────────────

export const auditFiltersSchema = z.object({
  candidateId: z.string().uuid().optional(),
  jobId: z.string().uuid().optional(),
  source: z.enum(['resume', 'portfolio', 'application', 'interview', 'manual', 'system']).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// ─── Upload Schemas ─────────────────────────────────────────────────────────────

export const uploadDocumentSchema = z.object({
  candidateId: z.string().uuid(),
  type: z.enum(['resume', 'portfolio', 'application', 'interview_note', 'interview', 'other']),
});

// ─── Type Exports ───────────────────────────────────────────────────────────────

export type RequirementInput = z.infer<typeof requirementSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type JobParams = z.infer<typeof jobParamsSchema>;

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>;
export type CandidateParams = z.infer<typeof candidateParamsSchema>;
export type MoveStageInput = z.infer<typeof moveStageSchema>;
export type OverrideGroupInput = z.infer<typeof overrideGroupSchema>;

export type InterviewQuestionInput = z.infer<typeof interviewQuestionSchema>;
export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>;
export type InterviewNoteInput = z.infer<typeof interviewNoteSchema>;
export type InterviewParams = z.infer<typeof interviewParamsSchema>;

export type MapCandidateInput = z.infer<typeof mapCandidateSchema>;
export type GenerateQuestionsInput = z.infer<typeof generateQuestionsSchema>;
export type GenerateFollowUpInput = z.infer<typeof generateFollowUpSchema>;
export type SynthesizeInterviewInput = z.infer<typeof synthesizeInterviewSchema>;
export type GenerateEvaluationInput = z.infer<typeof generateEvaluationSchema>;

export type SearchInput = z.infer<typeof searchSchema>;
export type AuditFiltersInput = z.infer<typeof auditFiltersSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;