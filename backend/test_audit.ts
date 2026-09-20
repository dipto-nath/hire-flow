import { PrismaClient } from '@prisma/client';
async function test() {
  const prisma = new PrismaClient();
  const count = await prisma.auditEvent.count();
  console.log("Audit event count:", count);
  if (count > 0) {
    console.log(await prisma.auditEvent.findFirst());
  }
}
test();
