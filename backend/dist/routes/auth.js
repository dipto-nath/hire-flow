import { prisma } from '../config/database.js';
import bcrypt from 'bcryptjs';
export async function authRoutes(app) {
    // POST /api/auth/login - Login user
    app.post('/login', async (request, reply) => {
        const { email, password } = request.body;
        if (!email || !password) {
            return reply.status(400).send({ error: 'Email and password are required' });
        }
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user || !user.password) {
            return reply.status(401).send({ error: 'Invalid credentials' });
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return reply.status(401).send({ error: 'Invalid credentials' });
        }
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return { ...userWithoutPassword, password: undefined };
    });
}
//# sourceMappingURL=auth.js.map