import { prisma } from '../config/database.js';
import { searchSchema } from '../schemas/index.js';
import { aiService } from '../services/aiService.js';
export async function searchRoutes(app) {
    // POST /api/search - Natural language search
    app.post('/', async (request, reply) => {
        const data = request.body;
        const parsed = searchSchema.safeParse(data);
        if (!parsed.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                details: parsed.error.flatten().fieldErrors,
            });
        }
        try {
            const results = await aiService.searchCandidates(parsed.data.query, parsed.data.jobId, parsed.data.limit);
            return { results };
        }
        catch (error) {
            console.error('Search failed:', error);
            return reply.status(500).send({ error: 'Search failed', message: String(error) });
        }
    });
    // GET /api/search/suggestions - Get search suggestions
    app.get('/suggestions', async (request) => {
        const { jobId, limit = 10 } = request.query;
        const where = {};
        if (jobId)
            where.jobId = jobId;
        const candidates = await prisma.candidate.findMany({
            where,
            select: {
                id: true,
                name: true,
                currentRole: true,
                currentCompany: true,
                skills: true,
                group: true,
            },
            take: limit,
        });
        // Extract unique skills and roles for suggestions
        const skills = new Set();
        const roles = new Set();
        candidates.forEach(c => {
            c.skills.forEach(s => skills.add(s));
            roles.add(c.currentRole);
        });
        return {
            skills: Array.from(skills).slice(0, 20),
            roles: Array.from(roles).slice(0, 20),
        };
    });
}
//# sourceMappingURL=search.js.map