import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const candidates = await prisma.candidate.findMany({
    include: { job: true }
  });
  
  console.log(`Found ${candidates.length} total candidates`);
  
  console.log(`Deleting all candidates...`);
  
  if (candidates.length > 0) {
    await prisma.candidate.deleteMany({});
    
    // reset job counts
    await prisma.job.updateMany({
      data: { candidateCount: 0 }
    });
  }
  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
