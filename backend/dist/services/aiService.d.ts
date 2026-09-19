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
    requirementCoverage: {
        requirementId: string;
        label: string;
        status: 'covered' | 'partial' | 'not_covered';
    }[];
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
/**
 * Process a document (resume, portfolio, etc.) and extract structured candidate profile
 */
export declare function processDocument(documentId: string, candidateId: string, jobId: string, filePath: string, mimeType: string, documentType: string): Promise<void>;
/**
 * Evaluate and classify candidate into a group based on requirements
 */
export declare function evaluateCandidateGroup(candidateId: string): Promise<CandidateGroupResult>;
/**
 * Generate interview questions based on candidate profile and missing evidence
 */
export declare function generateInterviewQuestions(candidateId: string, jobId: string, focusAreas?: string[]): Promise<InterviewQuestion[]>;
/**
 * Synthesize interview notes and determine requirement coverage
 */
export declare function synthesizeInterview(interviewId: string): Promise<InterviewSynthesis>;
/**
 * Generate evaluation report for a candidate
 */
export declare function generateEvaluationReport(candidateId: string, interviewId?: string): Promise<EvaluationReport>;
/**
 * Search candidates using natural language query
 */
export declare function searchCandidates(query: string, jobId?: string, limit?: number): Promise<Array<{
    candidate: any;
    matchReasons: Array<{
        label: string;
        source: string;
        detail: string;
    }>;
    relevanceScore: number;
}>>;
/**
 * Generate follow-up questions during an interview
 */
export declare function generateFollowUp(interviewId: string, noteContent: string, requirementLabel: string, requirementId?: string): Promise<FollowUpSuggestion>;
export {};
//# sourceMappingURL=aiService.d.ts.map