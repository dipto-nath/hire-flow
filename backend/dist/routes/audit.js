import { prisma } from '../config/database.js';
import { auditFiltersSchema } from '../schemas/index.js';
export async function auditRoutes(app) {
    // GET /api/audit - Get audit trail
    app.get('/', async (request) => {
        const data = request.query;
        const parsed = auditFiltersSchema.safeParse(data);
        if (!parsed.success) {
            return { events: [], total: 0 };
        }
        const { candidateId, jobId, source, limit = 50, offset = 0 } = parsed.data;
        const where = {};
        if (candidateId)
            where.candidateId = candidateId;
        if (jobId)
            where.jobId = jobId;
        if (source)
            where.source = source;
        const [events, total] = await Promise.all([
            prisma.auditEvent.findMany({
                where,
                include: {
                    candidate: { select: { id: true, name: true } },
                    job: { select: { id: true, title: true } },
                },
                orderBy: { timestamp: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.auditEvent.count({ where }),
        ]);
        return { events, total, limit, offset };
    });
    // GET /api/audit/:id - Get audit event by ID
    app.get('/:id', async (request, reply) => {
        const { id } = request.params;
        const event = await prisma.auditEvent.findUnique({
            where: { id },
            include: {
                candidate: true,
                job: true,
            },
        });
        if (!event) {
            return reply.status(404).send({ error: 'Audit event not found' });
        }
        return event;
    });
    // GET /api/audit/candidate/:candidateId - Get audit trail for candidate
    app.get('/candidate/:candidateId', async (request) => {
        const { candidateId } = request.params;
        const { limit = 50, offset = 0 } = request.query;
        const [events, total] = await Promise.all([
            prisma.auditEvent.findMany({
                where: { candidateId },
                include: {
                    job: { select: { id: true, title: true } },
                },
                orderBy: { timestamp: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.auditEvent.count({ where: { candidateId } }),
        ]);
        return { events, total, limit, offset };
    });
    // GET /api/audit/job/:jobId - Get audit trail for job
    app.get('/job/:jobId', async (request) => {
        const { jobId } = request.params;
        const { limit = 50, offset = 0 } = request.query;
        const [events, total] = await Promise.all([
            prisma.auditEvent.findMany({
                where: { jobId },
                include: {
                    candidate: { select: { id: true, name: true } },
                },
                orderBy: { timestamp: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.auditEvent.count({ where: { jobId } }),
        ]);
        return { events, total, limit, offset };
    });
    // POST /api/audit - Create manual audit event
    app.post('/', async (request, reply) => {
        const { candidateId, jobId, insight, source, sourceLabel, action, evidenceTrace } = request.body;
        if (!candidateId || !insight || !source || !sourceLabel || !action) {
            return reply.status(400).send({ error: 'Missing required fields' });
        }
        const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
        const job = jobId ? await prisma.job.findUnique({ where: { id: jobId } }) : null;
        const event = await prisma.auditEvent.create({
            data: {
                candidateId,
                candidateName: candidate?.name || 'Unknown',
                jobId,
                jobTitle: job?.title,
                insight,
                source,
                sourceLabel,
                generatedBy: 'recruiter',
                action,
                evidenceTrace,
            },
        });
        return reply.status(201).send(event);
    });
}
//# sourceMappingURL=audit.js.map