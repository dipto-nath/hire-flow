import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const badCandidates = await prisma.candidate.findMany({
    where: {
      OR: [
        { email: { startsWith: 'pending' } },
        { name: { contains: 'Resume' } }
      ]
    }
  });

  console.log('Found candidates to delete:', badCandidates.map(c => c.name));

  const result = await prisma.candidate.deleteMany({
    where: {
      OR: [
        { email: { startsWith: 'pending' } },
        { name: { contains: 'Resume' } }
      ]
    }
  });

  console.log(`Deleted ${result.count} candidates.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
