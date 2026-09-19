import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const candidates = await prisma.candidate.findMany({
    include: { job: true }
  });
  
  console.log(`Found ${candidates.length} total candidates`);
  
  // Delete all candidates that have 'pending-' emails or failed/incomplete extraction
  const toDelete = candidates.filter(c => c.yearsExperience === 0 || c.email.includes('pending-'));
  
  console.log(`Deleting ${toDelete.length} bad/pending candidates...`);
  
  if (toDelete.length > 0) {
    await prisma.candidate.deleteMany({
      where: { id: { in: toDelete.map(c => c.id) } }
    });
    
    // update job counts
    for (const c of toDelete) {
      if (c.jobId) {
        await prisma.job.update({
          where: { id: c.jobId },
          data: { candidateCount: { decrement: 1 } }
        });
      }
    }
  }
  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
