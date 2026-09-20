import { PrismaClient } from '@prisma/client';
async function test() {
  const prisma = new PrismaClient();
  const doc = await prisma.candidateDocument.findFirst();
  console.log(doc);
}
test();
