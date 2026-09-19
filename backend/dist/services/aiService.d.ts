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
/**
 * Process uploaded document with AI to extract candidate profile and map to requirements
 */
export declare function processDocument(documentId: string, candidateId: string, jobId: string, text: string, documentType: string): Promise<void>;
/**
 * Generate interview questions based on candidate gaps
 */
export declare function generateInterviewQuestions(candidateId: string, jobId: string, focusAreas?: string[]): Promise<InterviewQuestion[]>;
/**
 * Generate follow-up question during live interview
 */
export declare function generateFollowUp(interviewId: string, noteContent: string, requirementLabel: string, requirementId?: string): Promise<FollowUpSuggestion>;
export {};
//# sourceMappingURL=aiService.d.ts.map