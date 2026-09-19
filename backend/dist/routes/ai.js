import { prisma } from '../config/database.js';
import { mapCandidateSchema, generateQuestionsSchema, generateFollowUpSchema, synthesizeInterviewSchema, generateEvaluationSchema, } from '../schemas/index.js';
import * as aiService from '../services/aiService.js';
export async function aiRoutes(app) {
    // POST /api/ai/map-candidate - Map candidate to job requirements
    app.post('/map-candidate', async (request, reply) => {
        const data = request.body;
        const parsed = mapCandidateSchema.safeParse(data);
        if (!parsed.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                details: parsed.error.flatten().fieldErrors,
            });
        }
        const candidate = await prisma.candidate.findUnique({
            where: { id: parsed.data.candidateId },
            include: { documents: true },
        });
        if (!candidate) {
            return reply.status(404).send({ error: 'Candidate not found' });
        }
        const resumeDoc = candidate.documents.find(d => d.type === 'resume' && d.extractedText);
        if (!resumeDoc) {
            return reply.status(400).send({ error: 'No resume text available for processing' });
        }
        try {
            await aiService.processDocument(resumeDoc.id, candidate.id, candidate.jobId, resumeDoc.filePath || '', 'application/pdf', 'resume');
            return { success: true, message: 'Candidate mapped successfully' };
        }
        catch (error) {
            console.error('Mapping failed:', error);
            return reply.status(500).send({ error: 'Mapping failed', message: String(error) });
        }
    });
    // POST /api/ai/generate-questions - Generate interview questions
    app.post('/generate-questions', async (request, reply) => {
        const data = request.body;
        const parsed = generateQuestionsSchema.safeParse(data);
        if (!parsed.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                details: parsed.error.flatten().fieldErrors,
            });
        }
        try {
            const questions = await aiService.generateInterviewQuestions(parsed.data.candidateId, parsed.data.jobId, parsed.data.focusAreas);
            const interview = await prisma.interview.findFirst({
                where: { candidateId: parsed.data.candidateId, jobId: parsed.data.jobId },
                orderBy: { createdAt: 'desc' },
            });
            if (interview) {
                await prisma.interviewQuestion.createMany({
                    data: questions.map(q => ({
                        interviewId: interview.id,
                        text: q.text,
                        category: q.category,
                        requirementId: q.requirementId,
                        requirementLabel: q.requirementLabel,
                        whyAsk: q.whyAsk,
                        evidenceContext: q.evidenceContext,
                        expectedEvidence: q.expectedEvidence,
                        addedToInterview: true,
                    })),
                });
            }
            return { questions };
        }
        catch (error) {
            console.error('Question generation failed:', error);
            return reply.status(500).send({ error: 'Question generation failed', message: String(error) });
        }
    });
    // POST /api/ai/generate-followup - Generate follow-up question
    app.post('/generate-followup', async (request, reply) => {
        const data = request.body;
        const parsed = generateFollowUpSchema.safeParse(data);
        if (!parsed.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                details: parsed.error.flatten().fieldErrors,
            });
        }
        try {
            const followUp = await aiService.generateFollowUp(parsed.data.interviewId, parsed.data.noteContent, parsed.data.requirementLabel, parsed.data.requirementId);
            return { followUp };
        }
        catch (error) {
            console.error('Follow-up generation failed:', error);
            return reply.status(500).send({ error: 'Follow-up generation failed', message: String(error) });
        }
    });
    // POST /api/ai/synthesize-interview - Synthesize interview
    app.post('/synthesize-interview', async (request, reply) => {
        const data = request.body;
        const parsed = synthesizeInterviewSchema.safeParse(data);
        if (!parsed.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                details: parsed.error.flatten().fieldErrors,
            });
        }
        try {
            const synthesis = await aiService.synthesizeInterview(parsed.data.interviewId);
            await prisma.interviewSummary.upsert({
                where: { interviewId: parsed.data.interviewId },
                create: {
                    interviewId: parsed.data.interviewId,
                    ...synthesis,
                },
                update: synthesis,
            });
            return { synthesis };
        }
        catch (error) {
            console.error('Interview synthesis failed:', error);
            return reply.status(500).send({ error: 'Interview synthesis failed', message: String(error) });
        }
    });
    // POST /api/ai/generate-evaluation - Generate evaluation report
    app.post('/generate-evaluation', async (request, reply) => {
        const data = request.body;
        const parsed = generateEvaluationSchema.safeParse(data);
        if (!parsed.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                details: parsed.error.flatten().fieldErrors,
            });
        }
        try {
            const evaluation = await aiService.generateEvaluationReport(parsed.data.candidateId, parsed.data.interviewId);
            await prisma.evaluation.upsert({
                where: { candidateId: parsed.data.candidateId },
                create: {
                    candidateId: parsed.data.candidateId,
                    jobId: (await prisma.candidate.findUnique({ where: { id: parsed.data.candidateId } })).jobId,
                    interviewId: parsed.data.interviewId,
                    requirementRows: evaluation.requirementRows,
                    interviewEvidence: evaluation.interviewEvidence,
                    outstandingValidation: evaluation.outstandingValidation,
                    overallRating: evaluation.overallRating,
                    strengths: evaluation.strengths,
                    concerns: evaluation.concerns,
                    additionalValidation: evaluation.additionalValidation,
                    recommendation: evaluation.recommendation,
                },
                update: {
                    requirementRows: evaluation.requirementRows,
                    interviewEvidence: evaluation.interviewEvidence,
                    outstandingValidation: evaluation.outstandingValidation,
                    overallRating: evaluation.overallRating,
                    strengths: evaluation.strengths,
                    concerns: evaluation.concerns,
                    additionalValidation: evaluation.additionalValidation,
                    recommendation: evaluation.recommendation,
                },
            });
            return { evaluation };
        }
        catch (error) {
            console.error('Evaluation generation failed:', error);
            return reply.status(500).send({ error: 'Evaluation generation failed', message: String(error) });
        }
    });
}
//# sourceMappingURL=ai.js.map