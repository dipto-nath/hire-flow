import { z } from 'zod';
export declare const requirementSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["required", "preferred"]>;
    category: z.ZodEnum<["skill", "experience", "education", "domain", "other"]>;
    label: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "required" | "preferred";
    category: "other" | "skill" | "experience" | "education" | "domain";
    label: string;
    id?: string | undefined;
    description?: string | undefined;
}, {
    type: "required" | "preferred";
    category: "other" | "skill" | "experience" | "education" | "domain";
    label: string;
    id?: string | undefined;
    description?: string | undefined;
}>;
export declare const createJobSchema: z.ZodObject<{
    title: z.ZodString;
    department: z.ZodString;
    location: z.ZodString;
    employmentType: z.ZodEnum<["full_time", "part_time", "contract", "internship"]>;
    experienceLevel: z.ZodEnum<["entry", "mid", "senior", "lead", "executive"]>;
    description: z.ZodString;
    requirements: z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["required", "preferred"]>;
        category: z.ZodEnum<["skill", "experience", "education", "domain", "other"]>;
        label: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "required" | "preferred";
        category: "other" | "skill" | "experience" | "education" | "domain";
        label: string;
        id?: string | undefined;
        description?: string | undefined;
    }, {
        type: "required" | "preferred";
        category: "other" | "skill" | "experience" | "education" | "domain";
        label: string;
        id?: string | undefined;
        description?: string | undefined;
    }>, "many">;
    status: z.ZodDefault<z.ZodEnum<["active", "draft", "closed", "paused"]>>;
}, "strip", z.ZodTypeAny, {
    status: "active" | "draft" | "closed" | "paused";
    description: string;
    title: string;
    department: string;
    location: string;
    employmentType: "full_time" | "part_time" | "contract" | "internship";
    experienceLevel: "entry" | "mid" | "senior" | "lead" | "executive";
    requirements: {
        type: "required" | "preferred";
        category: "other" | "skill" | "experience" | "education" | "domain";
        label: string;
        id?: string | undefined;
        description?: string | undefined;
    }[];
}, {
    description: string;
    title: string;
    department: string;
    location: string;
    employmentType: "full_time" | "part_time" | "contract" | "internship";
    experienceLevel: "entry" | "mid" | "senior" | "lead" | "executive";
    requirements: {
        type: "required" | "preferred";
        category: "other" | "skill" | "experience" | "education" | "domain";
        label: string;
        id?: string | undefined;
        description?: string | undefined;
    }[];
    status?: "active" | "draft" | "closed" | "paused" | undefined;
}>;
export declare const updateJobSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    employmentType: z.ZodOptional<z.ZodEnum<["full_time", "part_time", "contract", "internship"]>>;
    experienceLevel: z.ZodOptional<z.ZodEnum<["entry", "mid", "senior", "lead", "executive"]>>;
    description: z.ZodOptional<z.ZodString>;
    requirements: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["required", "preferred"]>;
        category: z.ZodEnum<["skill", "experience", "education", "domain", "other"]>;
        label: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "required" | "preferred";
        category: "other" | "skill" | "experience" | "education" | "domain";
        label: string;
        id?: string | undefined;
        description?: string | undefined;
    }, {
        type: "required" | "preferred";
        category: "other" | "skill" | "experience" | "education" | "domain";
        label: string;
        id?: string | undefined;
        description?: string | undefined;
    }>, "many">>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["active", "draft", "closed", "paused"]>>>;
}, "strip", z.ZodTypeAny, {
    status?: "active" | "draft" | "closed" | "paused" | undefined;
    description?: string | undefined;
    title?: string | undefined;
    department?: string | undefined;
    location?: string | undefined;
    employmentType?: "full_time" | "part_time" | "contract" | "internship" | undefined;
    experienceLevel?: "entry" | "mid" | "senior" | "lead" | "executive" | undefined;
    requirements?: {
        type: "required" | "preferred";
        category: "other" | "skill" | "experience" | "education" | "domain";
        label: string;
        id?: string | undefined;
        description?: string | undefined;
    }[] | undefined;
}, {
    status?: "active" | "draft" | "closed" | "paused" | undefined;
    description?: string | undefined;
    title?: string | undefined;
    department?: string | undefined;
    location?: string | undefined;
    employmentType?: "full_time" | "part_time" | "contract" | "internship" | undefined;
    experienceLevel?: "entry" | "mid" | "senior" | "lead" | "executive" | undefined;
    requirements?: {
        type: "required" | "preferred";
        category: "other" | "skill" | "experience" | "education" | "domain";
        label: string;
        id?: string | undefined;
        description?: string | undefined;
    }[] | undefined;
}>;
export declare const jobParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const createCandidateSchema: z.ZodObject<{
    jobId: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    currentRole: z.ZodOptional<z.ZodString>;
    currentCompany: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    yearsExperience: z.ZodDefault<z.ZodNumber>;
    skills: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    education: z.ZodOptional<z.ZodString>;
    stage: z.ZodDefault<z.ZodEnum<["applied", "screening", "interview", "evaluation", "decision"]>>;
}, "strip", z.ZodTypeAny, {
    jobId: string;
    name: string;
    email: string;
    yearsExperience: number;
    skills: string[];
    stage: "interview" | "evaluation" | "applied" | "screening" | "decision";
    education?: string | undefined;
    location?: string | undefined;
    currentRole?: string | undefined;
    currentCompany?: string | undefined;
}, {
    jobId: string;
    name: string;
    email: string;
    education?: string | undefined;
    location?: string | undefined;
    currentRole?: string | undefined;
    currentCompany?: string | undefined;
    yearsExperience?: number | undefined;
    skills?: string[] | undefined;
    stage?: "interview" | "evaluation" | "applied" | "screening" | "decision" | undefined;
}>;
export declare const updateCandidateSchema: z.ZodObject<Omit<{
    jobId: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    currentRole: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    currentCompany: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    location: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    yearsExperience: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    skills: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    education: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    stage: z.ZodOptional<z.ZodDefault<z.ZodEnum<["applied", "screening", "interview", "evaluation", "decision"]>>>;
}, "jobId">, "strip", z.ZodTypeAny, {
    education?: string | undefined;
    location?: string | undefined;
    name?: string | undefined;
    email?: string | undefined;
    currentRole?: string | undefined;
    currentCompany?: string | undefined;
    yearsExperience?: number | undefined;
    skills?: string[] | undefined;
    stage?: "interview" | "evaluation" | "applied" | "screening" | "decision" | undefined;
}, {
    education?: string | undefined;
    location?: string | undefined;
    name?: string | undefined;
    email?: string | undefined;
    currentRole?: string | undefined;
    currentCompany?: string | undefined;
    yearsExperience?: number | undefined;
    skills?: string[] | undefined;
    stage?: "interview" | "evaluation" | "applied" | "screening" | "decision" | undefined;
}>;
export declare const candidateParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const moveStageSchema: z.ZodObject<{
    stage: z.ZodEnum<["applied", "screening", "interview", "evaluation", "decision"]>;
}, "strip", z.ZodTypeAny, {
    stage: "interview" | "evaluation" | "applied" | "screening" | "decision";
}, {
    stage: "interview" | "evaluation" | "applied" | "screening" | "decision";
}>;
export declare const overrideGroupSchema: z.ZodObject<{
    group: z.ZodEnum<["strong_match", "potential_match", "needs_validation", "insufficient_evidence"]>;
}, "strip", z.ZodTypeAny, {
    group: "strong_match" | "potential_match" | "needs_validation" | "insufficient_evidence";
}, {
    group: "strong_match" | "potential_match" | "needs_validation" | "insufficient_evidence";
}>;
export declare const interviewQuestionSchema: z.ZodObject<{
    text: z.ZodString;
    category: z.ZodEnum<["technical", "validation", "experience", "project", "behavioral"]>;
    requirementId: z.ZodOptional<z.ZodString>;
    requirementLabel: z.ZodOptional<z.ZodString>;
    whyAsk: z.ZodOptional<z.ZodString>;
    evidenceContext: z.ZodOptional<z.ZodString>;
    expectedEvidence: z.ZodOptional<z.ZodString>;
    addedToInterview: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    category: "validation" | "experience" | "technical" | "project" | "behavioral";
    text: string;
    addedToInterview: boolean;
    requirementId?: string | undefined;
    requirementLabel?: string | undefined;
    whyAsk?: string | undefined;
    evidenceContext?: string | undefined;
    expectedEvidence?: string | undefined;
}, {
    category: "validation" | "experience" | "technical" | "project" | "behavioral";
    text: string;
    requirementId?: string | undefined;
    requirementLabel?: string | undefined;
    whyAsk?: string | undefined;
    evidenceContext?: string | undefined;
    expectedEvidence?: string | undefined;
    addedToInterview?: boolean | undefined;
}>;
export declare const createInterviewSchema: z.ZodObject<{
    candidateId: z.ZodString;
    jobId: z.ZodString;
    scheduledAt: z.ZodOptional<z.ZodString>;
    interviewers: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    questions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        text: z.ZodString;
        category: z.ZodEnum<["technical", "validation", "experience", "project", "behavioral"]>;
        requirementId: z.ZodOptional<z.ZodString>;
        requirementLabel: z.ZodOptional<z.ZodString>;
        whyAsk: z.ZodOptional<z.ZodString>;
        evidenceContext: z.ZodOptional<z.ZodString>;
        expectedEvidence: z.ZodOptional<z.ZodString>;
        addedToInterview: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        category: "validation" | "experience" | "technical" | "project" | "behavioral";
        text: string;
        addedToInterview: boolean;
        requirementId?: string | undefined;
        requirementLabel?: string | undefined;
        whyAsk?: string | undefined;
        evidenceContext?: string | undefined;
        expectedEvidence?: string | undefined;
    }, {
        category: "validation" | "experience" | "technical" | "project" | "behavioral";
        text: string;
        requirementId?: string | undefined;
        requirementLabel?: string | undefined;
        whyAsk?: string | undefined;
        evidenceContext?: string | undefined;
        expectedEvidence?: string | undefined;
        addedToInterview?: boolean | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    jobId: string;
    candidateId: string;
    interviewers: string[];
    questions: {
        category: "validation" | "experience" | "technical" | "project" | "behavioral";
        text: string;
        addedToInterview: boolean;
        requirementId?: string | undefined;
        requirementLabel?: string | undefined;
        whyAsk?: string | undefined;
        evidenceContext?: string | undefined;
        expectedEvidence?: string | undefined;
    }[];
    scheduledAt?: string | undefined;
}, {
    jobId: string;
    candidateId: string;
    scheduledAt?: string | undefined;
    interviewers?: string[] | undefined;
    questions?: {
        category: "validation" | "experience" | "technical" | "project" | "behavioral";
        text: string;
        requirementId?: string | undefined;
        requirementLabel?: string | undefined;
        whyAsk?: string | undefined;
        evidenceContext?: string | undefined;
        expectedEvidence?: string | undefined;
        addedToInterview?: boolean | undefined;
    }[] | undefined;
}>;
export declare const updateInterviewSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["scheduled", "in_progress", "completed", "cancelled"]>>;
    scheduledAt: z.ZodOptional<z.ZodString>;
    completedAt: z.ZodOptional<z.ZodString>;
    interviewers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    status?: "scheduled" | "in_progress" | "completed" | "cancelled" | undefined;
    scheduledAt?: string | undefined;
    interviewers?: string[] | undefined;
    completedAt?: string | undefined;
}, {
    status?: "scheduled" | "in_progress" | "completed" | "cancelled" | undefined;
    scheduledAt?: string | undefined;
    interviewers?: string[] | undefined;
    completedAt?: string | undefined;
}>;
export declare const interviewNoteSchema: z.ZodObject<{
    questionId: z.ZodOptional<z.ZodString>;
    questionText: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
    requirementId: z.ZodOptional<z.ZodString>;
    requirementLabel: z.ZodOptional<z.ZodString>;
    flaggedForFollowUp: z.ZodDefault<z.ZodBoolean>;
    type: z.ZodDefault<z.ZodEnum<["evidence", "note", "follow_up"]>>;
}, "strip", z.ZodTypeAny, {
    type: "evidence" | "note" | "follow_up";
    content: string;
    flaggedForFollowUp: boolean;
    requirementId?: string | undefined;
    requirementLabel?: string | undefined;
    questionId?: string | undefined;
    questionText?: string | undefined;
}, {
    content: string;
    type?: "evidence" | "note" | "follow_up" | undefined;
    requirementId?: string | undefined;
    requirementLabel?: string | undefined;
    questionId?: string | undefined;
    questionText?: string | undefined;
    flaggedForFollowUp?: boolean | undefined;
}>;
export declare const interviewParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const mapCandidateSchema: z.ZodObject<{
    candidateId: z.ZodString;
    jobId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    jobId: string;
    candidateId: string;
}, {
    jobId: string;
    candidateId: string;
}>;
export declare const generateQuestionsSchema: z.ZodObject<{
    candidateId: z.ZodString;
    jobId: z.ZodString;
    focusAreas: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    jobId: string;
    candidateId: string;
    focusAreas?: string[] | undefined;
}, {
    jobId: string;
    candidateId: string;
    focusAreas?: string[] | undefined;
}>;
export declare const generateFollowUpSchema: z.ZodObject<{
    interviewId: z.ZodString;
    noteContent: z.ZodString;
    requirementLabel: z.ZodString;
    requirementId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    requirementLabel: string;
    interviewId: string;
    noteContent: string;
    requirementId?: string | undefined;
}, {
    requirementLabel: string;
    interviewId: string;
    noteContent: string;
    requirementId?: string | undefined;
}>;
export declare const synthesizeInterviewSchema: z.ZodObject<{
    interviewId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    interviewId: string;
}, {
    interviewId: string;
}>;
export declare const generateEvaluationSchema: z.ZodObject<{
    candidateId: z.ZodString;
    interviewId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    candidateId: string;
    interviewId?: string | undefined;
}, {
    candidateId: string;
    interviewId?: string | undefined;
}>;
export declare const searchSchema: z.ZodObject<{
    query: z.ZodString;
    jobId: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    query: string;
    limit: number;
    jobId?: string | undefined;
}, {
    query: string;
    jobId?: string | undefined;
    limit?: number | undefined;
}>;
export declare const auditFiltersSchema: z.ZodObject<{
    candidateId: z.ZodOptional<z.ZodString>;
    jobId: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodEnum<["resume", "portfolio", "application", "interview", "manual", "system"]>>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    jobId?: string | undefined;
    candidateId?: string | undefined;
    source?: "interview" | "resume" | "portfolio" | "application" | "manual" | "system" | undefined;
}, {
    jobId?: string | undefined;
    candidateId?: string | undefined;
    limit?: number | undefined;
    source?: "interview" | "resume" | "portfolio" | "application" | "manual" | "system" | undefined;
    offset?: number | undefined;
}>;
export declare const uploadDocumentSchema: z.ZodObject<{
    candidateId: z.ZodString;
    type: z.ZodEnum<["resume", "portfolio", "application", "interview_note", "interview", "other"]>;
}, "strip", z.ZodTypeAny, {
    type: "other" | "interview" | "resume" | "portfolio" | "application" | "interview_note";
    candidateId: string;
}, {
    type: "other" | "interview" | "resume" | "portfolio" | "application" | "interview_note";
    candidateId: string;
}>;
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
//# sourceMappingURL=index.d.ts.map