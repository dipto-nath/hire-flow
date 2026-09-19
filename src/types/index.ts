// ─── Core Types ──────────────────────────────────────────────────────────────

export type EvidenceStatus =
  | 'verified'
  | 'strong'
  | 'partial'
  | 'needs_validation'
  | 'not_found';

export type CandidateStage =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'evaluation'
  | 'decision';

export type CandidateGroup =
  | 'strong_match'
  | 'potential_match'
  | 'needs_validation'
  | 'insufficient_evidence';

export type JobStatus = 'active' | 'draft' | 'closed' | 'paused';

export type InterviewStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type DocumentType = 'resume' | 'portfolio' | 'application' | 'interview_note' | 'interview' | 'other';

export type AuditSource =
  | 'resume'
  | 'portfolio'
  | 'application'
  | 'interview'
  | 'manual'
  | 'system';

// ─── Job ─────────────────────────────────────────────────────────────────────

export interface Requirement {
  id: string;
  type: 'required' | 'preferred';
  category: 'skill' | 'experience' | 'education' | 'domain' | 'other';
  label: string;
  description?: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'internship';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  status: JobStatus;
  description: string;
  requirements: Requirement[];
  candidateCount: number;
  interviewCount: number;
  createdAt: string;
  updatedAt: string;
  hiringStage: string;
}

// ─── Candidate ───────────────────────────────────────────────────────────────

export interface CandidateDocument {
  id: string;
  name: string;
  type: DocumentType;
  uploadedAt: string;
  status: 'uploading' | 'processing' | 'ready' | 'needs_review' | 'failed';
  size?: string;
}

export interface Evidence {
  id: string;
  requirementId: string;
  status: EvidenceStatus;
  excerpt: string;
  source: DocumentType;
  sourceLabel: string;
  location?: string;
  notes?: string;
}

export interface Candidate {
  id: string;
  jobId: string;
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
  stage: CandidateStage;
  group: CandidateGroup;
  groupOverridden?: boolean;
  requirementCoverage: number; // 0–100
  validationNeeded: boolean;
  interviewStatus?: InterviewStatus;
  documents: CandidateDocument[];
  evidence: Evidence[];
  summary?: CandidateSummary;
  addedAt: string;
  updatedAt: string;
  initials: string;
  avatarColor: string;
}

export interface CandidateSummary {
  overview: string;
  experience: string;
  skills: string;
  projects: string;
  education: string;
  domainExperience: string;
  potentialGaps: string;
}

// ─── Requirement Match ────────────────────────────────────────────────────────

export interface RequirementMatch {
  requirement: Requirement;
  evidence: Evidence | null;
  status: EvidenceStatus;
  validationQuestion?: string;
}

// ─── Interview ────────────────────────────────────────────────────────────────

export interface InterviewQuestion {
  id: string;
  text: string;
  category: 'technical' | 'experience' | 'project' | 'validation' | 'behavioral';
  requirementId?: string;
  requirementLabel?: string;
  whyAsk: string;
  evidenceContext?: string;
  expectedEvidence: string;
  addedToInterview?: boolean;
}

export interface InterviewNote {
  id: string;
  questionId?: string;
  questionText?: string;
  content: string;
  requirementId?: string;
  requirementLabel?: string;
  flaggedForFollowUp?: boolean;
  timestamp: string;
  type: 'note' | 'evidence' | 'follow_up_needed' | 'requirement_covered';
}

export interface FollowUpSuggestion {
  id: string;
  question: string;
  why: string;
  whatToValidate: string;
  basedOnNote?: string;
  requirementId?: string;
  requirementLabel?: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  jobId: string;
  status: InterviewStatus;
  scheduledAt?: string;
  completedAt?: string;
  interviewers: string[];
  questions: InterviewQuestion[];
  notes: InterviewNote[];
  summary?: InterviewSummary;
}

export interface InterviewSummary {
  keyEvidence: string[];
  requirementCoverage: { requirementId: string; label: string; status: 'covered' | 'partial' | 'not_covered' }[];
  strongEvidence: string[];
  unresolvedQuestions: string[];
  contradictions: string[];
  followUpNeeded: string[];
}

// ─── Evaluation ───────────────────────────────────────────────────────────────

export type EvaluationRating =
  | 'strong_evidence'
  | 'meets_requirements'
  | 'partially_meets'
  | 'needs_more_evidence'
  | 'does_not_meet';

export interface EvaluationRequirementRow {
  requirementId: string;
  requirementLabel: string;
  evidence: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
  status: EvidenceStatus;
  source: string;
}

export interface Evaluation {
  id: string;
  candidateId: string;
  jobId: string;
  interviewId?: string;
  createdAt: string;
  interviewDate?: string;
  interviewers: string[];
  requirementRows: EvaluationRequirementRow[];
  interviewEvidence: string;
  outstandingValidation: string[];
  recruiterAssessment?: {
    overallRating?: EvaluationRating;
    strengths?: string;
    concerns?: string;
    additionalValidation?: string;
    recommendation?: string;
  };
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export interface AuditEvent {
  id: string;
  timestamp: string;
  candidateId: string;
  candidateName: string;
  jobId?: string;
  jobTitle?: string;
  insight: string;
  source: AuditSource;
  sourceLabel: string;
  generatedBy: 'hireflow' | 'recruiter';
  generatedByUser?: string;
  action: string;
  evidenceTrace?: EvidenceTrace;
}

export interface EvidenceTrace {
  insight: string;
  sourceDocument: string;
  location: string;
  extractedEvidence: string;
  reasoningContext: string;
  requirementId?: string;
  requirementLabel?: string;
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface SearchResult {
  candidate: Candidate;
  matchReasons: { label: string; source: string; detail: string }[];
  relevanceScore: number;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  description?: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

// ─── Pipeline Stats ──────────────────────────────────────────────────────────

export interface PipelineStage {
  label: string;
  key: CandidateStage;
  count: number;
}

export interface RequirementCoverage {
  requirementId: string;
  requirementLabel: string;
  coveredCount: number;
  totalCount: number;
  evidenceStrength: 'strong' | 'mixed' | 'partial' | 'weak';
}
