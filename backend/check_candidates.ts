import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const docs = await prisma.candidateDocument.findMany({
    orderBy: { uploadedAt: 'desc' },
    take: 3
  });

  for (const d of docs) {
    console.log(`Doc: ${d.name}, Status: ${d.status}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
