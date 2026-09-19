import { PrismaClient } from '@prisma/client';
import { processDocument } from './src/services/aiService.js';
const prisma = new PrismaClient();

async function main() {
  const doc = await prisma.candidateDocument.findFirst({
    where: { status: 'failed', extractedText: { not: '' } }
  });

  if (!doc) return console.log('No failed doc with text found');

  const candidate = await prisma.candidate.findUnique({ where: { id: doc.candidateId }});

  console.log('Running processDocument with Gemini...');
  try {
    await processDocument(doc.id, doc.candidateId, candidate!.jobId, doc.extractedText!, 'resume');
    console.log('Success! Candidate should be updated.');
  } catch (err) {
    console.error('FAILED:', err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
