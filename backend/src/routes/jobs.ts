import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database.js';
import { 
  createJobSchema, 
  updateJobSchema, 
  jobParamsSchema,
  CreateJobInput,
  UpdateJobInput,
  JobParams 
} from '../schemas/index.js';
import { JobStatus } from '@prisma/client';

export async function jobRoutes(app: FastifyInstance) {
  // GET /api/jobs - List all jobs
  app.get('/', async (request) => {
    const { status, limit = 50, offset = 0 } = request.query as { 
      status?: JobStatus; 
      limit?: string; 
      offset?: string; 
    };
    
    const parsedLimit = limit ? parseInt(limit as string, 10) : 50;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    const where = status ? { status } : {};
    
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          requirements: true,
          _count: {
            select: { candidates: true, interviews: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parsedLimit,
        skip: parsedOffset,
      }),
      prisma.job.count({ where }),
    ]);

    return {
      jobs: jobs.map(job => ({
        ...job,
        candidateCount: job._count?.candidates ?? 0,
        interviewCount: job._count?.interviews ?? 0,
      })),
      total,
      limit: parsedLimit,
      offset: parsedOffset,
    };
  });

  // GET /api/jobs/:id - Get job by ID
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as JobParams;
    
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        requirements: true,
        candidates: {
          include: {
            evidence: true,
            documents: true,
          },
        },
        interviews: true,
      },
    });

    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    return job;
  });

  // POST /api/jobs - Create job
  app.post('/', async (request, reply) => {
    const data = request.body as CreateJobInput;
    
    const parsed = createJobSchema.safeParse(data);
    if (!parsed.success) {
      return reply.status(400).send({ 
        error: 'Validation Error', 
        details: parsed.error.flatten().fieldErrors 
      });
    }

    const { requirements, ...jobData } = parsed.data;

    const job = await prisma.job.create({
      data: {
        ...jobData,
        requirements: {
          create: requirements.map(req => ({
            type: req.type,
            category: req.category,
            label: req.label,
            description: req.description,
          })),
        },
      },
      include: { requirements: true },
    });

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        candidateName: 'System',
        jobId: job.id,
        jobTitle: job.title,
        insight: `Job "${job.title}" created with ${requirements.length} requirements`,
        source: 'system',
        sourceLabel: 'Job Creation',
        generatedBy: 'hireflow',
        action: 'Job created',
      },
    });

    return reply.status(201).send(job);
  });

  // PATCH /api/jobs/:id - Update job
  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as JobParams;
    const data = request.body as UpdateJobInput;

    const parsed = updateJobSchema.safeParse(data);
    if (!parsed.success) {
      return reply.status(400).send({ 
        error: 'Validation Error', 
        details: parsed.error.flatten().fieldErrors 
      });
    }

    const { requirements, ...jobData } = parsed.data;

    const job = await prisma.job.update({
      where: { id },
      data: {
        ...jobData,
        requirements: requirements ? {
          deleteMany: {},
          create: requirements.map(req => ({
            type: req.type,
            category: req.category,
            label: req.label,
            description: req.description,
          })),
        } : undefined,
      },
      include: { requirements: true },
    });

    return job;
  });

  // DELETE /api/jobs/:id - Delete job
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as JobParams;

    await prisma.job.delete({ where: { id } });

    return { success: true };
  });

  // GET /api/jobs/:id/requirements - Get job requirements
  app.get('/:id/requirements', async (request, reply) => {
    const { id } = request.params as JobParams;

    const requirements = await prisma.requirement.findMany({
      where: { jobId: id },
      orderBy: [{ type: 'desc' }, { createdAt: 'asc' }], // required first
    });

    return requirements;
  });

  // POST /api/jobs/:id/requirements - Add requirement to job
  app.post('/:id/requirements', async (request, reply) => {
    const { id } = request.params as JobParams;
    const data = request.body as { 
      type: 'required' | 'preferred';
      category: 'skill' | 'experience' | 'education' | 'domain' | 'other';
      label: string;
      description?: string;
    };

    const requirement = await prisma.requirement.create({
      data: {
        jobId: id,
        ...data,
      },
    });

    return reply.status(201).send(requirement);
  });
}