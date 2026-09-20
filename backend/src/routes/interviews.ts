import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database.js';
import * as aiService from '../services/aiService.js';
import {
  createInterviewSchema,
  updateInterviewSchema,
  interviewNoteSchema,
  interviewParamsSchema,
  CreateInterviewInput,
  UpdateInterviewInput,
  InterviewNoteInput,
  InterviewParams,
} from '../schemas/index.js';

export async function interviewRoutes(app: FastifyInstance) {
  // GET /api/interviews - List all interviews
  app.get('/', async (request) => {
    const { candidateId, jobId, status, limit = 50, offset = 0 } = request.query as {
      candidateId?: string;
      jobId?: string;
      status?: string;
      limit?: number;
      offset?: number;
    };

    const where: any = {};
    if (candidateId) where.candidateId = candidateId;
    if (jobId) where.jobId = jobId;
    if (status) where.status = status;

    const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    const parsedOffset = typeof offset === 'string' ? parseInt(offset, 10) : offset;

    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        include: {
          candidate: { select: { id: true, name: true, email: true } },
          job: { select: { id: true, title: true } },
          questions: true,
          notes: true,
          summary: true,
        },
        orderBy: { createdAt: 'desc' },
        take: parsedLimit,
        skip: parsedOffset,
      }),
      prisma.interview.count({ where }),
    ]);

    return { interviews, total, limit: parsedLimit, offset: parsedOffset };
  });

  // GET /api/interviews/:id - Get interview by ID
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as InterviewParams;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        candidate: true,
        job: true,
        questions: true,
        notes: { orderBy: { timestamp: 'asc' } },
        summary: true,
      },
    });

    if (!interview) {
      return reply.status(404).send({ error: 'Interview not found' });
    }

    return interview;
  });

  // GET /api/interviews/candidate/:candidateId - Get interviews for candidate
  app.get('/candidate/:candidateId', async (request) => {
    const { candidateId } = request.params as { candidateId: string };

    const interviews = await prisma.interview.findMany({
      where: { candidateId },
      include: { questions: true, notes: true, summary: true },
      orderBy: { scheduledAt: 'desc' },
    });

    return interviews;
  });

  // POST /api/interviews - Create interview
  app.post('/', async (request, reply) => {
    const data = request.body as CreateInterviewInput;

    const parsed = createInterviewSchema.safeParse(data);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { questions, ...interviewData } = parsed.data;

    const interview = await prisma.interview.create({
      data: {
        ...interviewData,
        scheduledAt: interviewData.scheduledAt ? new Date(interviewData.scheduledAt) : null,
        questions: {
          create: questions.map(q => ({
            text: q.text,
            category: q.category,
            requirementId: q.requirementId,
            requirementLabel: q.requirementLabel,
            whyAsk: q.whyAsk,
            evidenceContext: q.evidenceContext,
            expectedEvidence: q.expectedEvidence,
            addedToInterview: q.addedToInterview,
          })),
        },
      },
      include: { questions: true, candidate: true, job: true },
    });

    await prisma.candidate.update({
      where: { id: interview.candidateId },
      data: { interviewStatus: 'scheduled' },
    });

    await prisma.job.update({
      where: { id: interview.jobId },
      data: { interviewCount: { increment: 1 } },
    });

    return reply.status(201).send(interview);
  });

  // PATCH /api/interviews/:id - Update interview
  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as InterviewParams;
    const data = request.body as UpdateInterviewInput;

    const parsed = updateInterviewSchema.safeParse(data);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const updateData: Record<string, any> = { ...parsed.data };
    if (updateData.scheduledAt) updateData.scheduledAt = new Date(updateData.scheduledAt);
    if (updateData.completedAt) updateData.completedAt = new Date(updateData.completedAt);

    const interview = await prisma.interview.update({
      where: { id },
      data: updateData,
      include: { candidate: true },
    });

    if (updateData.status) {
      const statusMap: Record<string, string> = {
        scheduled: 'scheduled',
        in_progress: 'interview',
        completed: 'completed',
        cancelled: 'cancelled',
      };
      await prisma.candidate.update({
        where: { id: interview.candidateId },
        data: { interviewStatus: statusMap[updateData.status] as any },
      });
    }

    return interview;
  });

  // POST /api/interviews/:id/notes - Add note to interview
  app.post('/:id/notes', async (request, reply) => {
    const { id } = request.params as InterviewParams;
    const data = request.body as InterviewNoteInput;

    const parsed = interviewNoteSchema.safeParse(data);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const note = await prisma.interviewNote.create({
      data: { interviewId: id, ...parsed.data },
    });

    const interview = await prisma.interview.findUnique({ where: { id } });
    if (interview?.status === 'scheduled') {
      await prisma.interview.update({ where: { id }, data: { status: 'in_progress' } });
      await prisma.candidate.update({
        where: { id: interview.candidateId },
        data: { interviewStatus: 'in_progress' },
      });
    }

    return reply.status(201).send(note);
  });

  // GET /api/interviews/:id/notes - Get notes for interview
  app.get('/:id/notes', async (request) => {
    const { id } = request.params as InterviewParams;

    const notes = await prisma.interviewNote.findMany({
      where: { interviewId: id },
      orderBy: { timestamp: 'asc' },
    });

    return notes;
  });

  // POST /api/interviews/:id/summary - Create/update interview summary
  app.post('/:id/summary', async (request, reply) => {
    const { id } = request.params as InterviewParams;
    const body = request.body as {
      keyEvidence?: string[];
      requirementCoverage?: Array<{ requirementId: string; label: string; status: 'covered' | 'partial' | 'not_covered' }>;
      strongEvidence?: string[];
      unresolvedQuestions?: string[];
      contradictions?: string[];
      followUpNeeded?: string[];
    };

    const { keyEvidence, requirementCoverage, strongEvidence, unresolvedQuestions, contradictions, followUpNeeded } = body;

    const summary = await prisma.interviewSummary.upsert({
      where: { interviewId: id },
      update: { keyEvidence, requirementCoverage, strongEvidence, unresolvedQuestions, contradictions, followUpNeeded },
      create: { interviewId: id, keyEvidence, requirementCoverage, strongEvidence, unresolvedQuestions, contradictions, followUpNeeded },
    });

    return summary;
  });

  // DELETE /api/interviews/:id - Delete interview
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as InterviewParams;

    const interview = await prisma.interview.findUnique({ where: { id } });
    if (!interview) {
      return reply.status(404).send({ error: 'Interview not found' });
    }

    await prisma.interview.delete({ where: { id } });

    await prisma.job.update({
      where: { id: interview.jobId },
      data: { interviewCount: { decrement: 1 } },
    });

    return { success: true };
  });

  // POST /api/interviews/generate-prep - Generate prep questions
  app.post('/generate-prep', async (request, reply) => {
    const { candidateId, jobId, numQuestions } = request.body as { candidateId: string; jobId: string; numQuestions?: number };
    if (!candidateId || !jobId) return reply.status(400).send({ error: 'Missing candidateId or jobId' });
    
    try {
      const questions = await aiService.generateInterviewPrep(candidateId, jobId, numQuestions);
      return { questions };
    } catch (err) {
      console.error(err);
      return reply.status(500).send({ error: 'Failed to generate prep questions' });
    }
  });

  // POST /api/interviews/:id/generate-follow-up - Generate follow up question
  app.post('/:id/generate-follow-up', async (request, reply) => {
    const { id } = request.params as InterviewParams;
    const { noteContent, requirementLabel, requirementId } = request.body as { noteContent: string, requirementLabel: string, requirementId?: string };
    
    if (!noteContent || !requirementLabel) return reply.status(400).send({ error: 'Missing required fields' });
    
    try {
      const followUp = await aiService.generateFollowUp(id, noteContent, requirementLabel, requirementId);
      return followUp;
    } catch (err) {
      console.error(err);
      return reply.status(500).send({ error: 'Failed to generate follow up' });
    }
  });

  // POST /api/interviews/:id/generate-report - Generate evaluation report
  app.post('/:id/generate-report', async (request, reply) => {
    const { id } = request.params as InterviewParams;
    const { candidateId } = request.body as { candidateId: string };
    
    if (!candidateId) return reply.status(400).send({ error: 'Missing candidateId' });
    
    try {
      const report = await aiService.generateEvaluationReport(candidateId, id);
      return report;
    } catch (err) {
      console.error(err);
      return reply.status(500).send({ error: 'Failed to generate report' });
    }
  });
}