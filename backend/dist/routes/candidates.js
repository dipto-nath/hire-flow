import { prisma } from '../config/database.js';
import { createCandidateSchema, updateCandidateSchema, moveStageSchema, overrideGroupSchema, } from '../schemas/index.js';
function getRandomColor() {
    const colors = [
        '#3730a3', '#0369a1', '#065f46', '#7c2d12', '#6b21a8',
        '#0f766e', '#9f1239', '#1d4ed8', '#b45309', '#4f46e5',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}
export async function candidateRoutes(app) {
    // GET /api/candidates - List all candidates (with optional jobId filter)
    app.get('/', async (request) => {
        const { jobId, stage, group, limit = 50, offset = 0 } = request.query;
        const where = {};
        if (jobId)
            where.jobId = jobId;
        if (stage)
            where.stage = stage;
        if (group)
            where.group = group;
        const [candidates, total] = await Promise.all([
            prisma.candidate.findMany({
                where,
                include: {
                    job: { select: { id: true, title: true } },
                    evidence: { include: { requirement: true } },
                    documents: true,
                    summary: true,
                    _count: { select: { interviews: true } },
                },
                orderBy: { addedAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.candidate.count({ where }),
        ]);
        return { candidates, total, limit, offset };
    });
    // GET /api/candidates/:id - Get candidate by ID
    app.get('/:id', async (request, reply) => {
        const { id } = request.params;
        const candidate = await prisma.candidate.findUnique({
            where: { id },
            include: {
                job: true,
                evidence: { include: { requirement: true } },
                documents: true,
                summary: true,
                interviews: {
                    include: {
                        questions: true,
                        notes: true,
                        summary: true,
                    },
                },
                evaluation: true,
                auditEvents: {
                    orderBy: { timestamp: 'desc' },
                    take: 20,
                },
            },
        });
        if (!candidate) {
            return reply.status(404).send({ error: 'Candidate not found' });
        }
        return candidate;
    });
    // POST /api/candidates - Create candidate
    app.post('/', async (request, reply) => {
        const data = request.body;
        const parsed = createCandidateSchema.safeParse(data);
        if (!parsed.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                details: parsed.error.flatten().fieldErrors,
            });
        }
        const { firstName, lastName, name, ...rest } = parsed.data;
        const fullName = name || `${firstName} ${lastName}`.trim();
        const candidate = await prisma.candidate.create({
            data: {
                ...rest,
                name: fullName,
                firstName: firstName || fullName.split(' ')[0],
                lastName: lastName || fullName.split(' ').slice(1).join(' '),
                initials: fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
                avatarColor: getRandomColor(),
            },
            include: { job: true },
        });
        await prisma.job.update({
            where: { id: candidate.jobId },
            data: { candidateCount: { increment: 1 } },
        });
        await prisma.auditEvent.create({
            data: {
                candidateId: candidate.id,
                candidateName: candidate.name,
                jobId: candidate.jobId,
                jobTitle: candidate.job?.title,
                insight: `Candidate ${candidate.name} added to pipeline`,
                source: 'manual',
                sourceLabel: 'Manual Entry',
                generatedBy: 'recruiter',
                action: 'Candidate created',
            },
        });
        return reply.status(201).send(candidate);
    });
    // PATCH /api/candidates/:id - Update candidate
    app.patch('/:id', async (request, reply) => {
        const { id } = request.params;
        const data = request.body;
        const parsed = updateCandidateSchema.safeParse(data);
        if (!parsed.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                details: parsed.error.flatten().fieldErrors,
            });
        }
        const candidate = await prisma.candidate.update({
            where: { id },
            data: parsed.data,
        });
        return candidate;
    });
    // PATCH /api/candidates/:id/stage - Move candidate stage
    app.patch('/:id/stage', async (request, reply) => {
        const { id } = request.params;
        const { stage } = request.body;
        const parsed = moveStageSchema.safeParse({ stage });
        if (!parsed.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                details: parsed.error.flatten().fieldErrors,
            });
        }
        const candidate = await prisma.candidate.update({
            where: { id },
            data: { stage: parsed.data.stage },
        });
        await prisma.auditEvent.create({
            data: {
                candidateId: candidate.id,
                candidateName: candidate.name,
                jobId: candidate.jobId,
                insight: `Stage moved to ${stage}`,
                source: 'manual',
                sourceLabel: 'Stage Update',
                generatedBy: 'recruiter',
                action: 'Stage updated',
            },
        });
        return candidate;
    });
    // PATCH /api/candidates/:id/group - Override candidate group
    app.patch('/:id/group', async (request, reply) => {
        const { id } = request.params;
        const { group } = request.body;
        const parsed = overrideGroupSchema.safeParse({ group });
        if (!parsed.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                details: parsed.error.flatten().fieldErrors,
            });
        }
        const candidate = await prisma.candidate.update({
            where: { id },
            data: { group: parsed.data.group, groupOverridden: true },
        });
        return candidate;
    });
    // GET /api/candidates/job/:jobId/groups - Get candidates grouped by group
    app.get('/job/:jobId/groups', async (request) => {
        const { jobId } = request.params;
        const candidates = await prisma.candidate.findMany({
            where: { jobId },
            include: { evidence: true },
        });
        const groups = {
            strong_match: candidates.filter(c => c.group === 'strong_match'),
            potential_match: candidates.filter(c => c.group === 'potential_match'),
            needs_validation: candidates.filter(c => c.group === 'needs_validation'),
            insufficient_evidence: candidates.filter(c => c.group === 'insufficient_evidence'),
        };
        return groups;
    });
    // GET /api/candidates/job/:jobId/stages - Get stage distribution
    app.get('/job/:jobId/stages', async (request) => {
        const { jobId } = request.params;
        const candidates = await prisma.candidate.findMany({
            where: { jobId },
        });
        const stages = {
            applied: 0,
            screening: 0,
            interview: 0,
            evaluation: 0,
            decision: 0,
        };
        candidates.forEach(c => stages[c.stage]++);
        return stages;
    });
    // DELETE /api/candidates/:id - Delete candidate
    app.delete('/:id', async (request, reply) => {
        const { id } = request.params;
        const candidate = await prisma.candidate.findUnique({ where: { id } });
        if (!candidate) {
            return reply.status(404).send({ error: 'Candidate not found' });
        }
        await prisma.candidate.delete({ where: { id } });
        await prisma.job.update({
            where: { id: candidate.jobId },
            data: { candidateCount: { decrement: 1 } },
        });
        return { success: true };
    });
}
//# sourceMappingURL=candidates.js.map