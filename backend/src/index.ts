import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import staticPlugin from '@fastify/static';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { jobRoutes } from './routes/jobs.js';
import { candidateRoutes } from './routes/candidates.js';
import { interviewRoutes } from './routes/interviews.js';
import { aiRoutes } from './routes/ai.js';
import { searchRoutes } from './routes/search.js';
import { auditRoutes } from './routes/audit.js';
import { uploadRoutes } from './routes/upload.js';
import { authRoutes } from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = Fastify({
  logger: {
    level: env.NODE_ENV === 'development' ? 'info' : 'warn',
    transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
  },
});

async function start() {
  // Register plugins
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(multipart, {
    limits: {
      fileSize: env.MAX_FILE_SIZE,
    },
  });

  // Serve uploaded files
  await app.register(staticPlugin, {
    root: join(__dirname, '..', env.UPLOAD_DIR),
    prefix: '/uploads/',
  });

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register routes
  await app.register(jobRoutes, { prefix: '/api/jobs' });
  await app.register(candidateRoutes, { prefix: '/api/candidates' });
  await app.register(interviewRoutes, { prefix: '/api/interviews' });
  await app.register(aiRoutes, { prefix: '/api/ai' });
  await app.register(searchRoutes, { prefix: '/api/search' });
  await app.register(auditRoutes, { prefix: '/api/audit' });
  await app.register(uploadRoutes, { prefix: '/api/upload' });
  await app.register(authRoutes, { prefix: '/api/auth' });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    
    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: error.message,
        details: error.validation,
      });
    }

    return reply.status(500).send({
      error: 'Internal Server Error',
      message: env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
    });
  });

  // Start server
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`Server listening on port ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  app.log.info('Shutting down...');
  await prisma.$disconnect();
  await app.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  app.log.info('Shutting down...');
  await prisma.$disconnect();
  await app.close();
  process.exit(0);
});

start();

export { app };