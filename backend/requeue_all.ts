import { PrismaClient } from '@prisma/client';
import { env } from './src/config/env.js';

async function test() {
  const prisma = new PrismaClient();
  const failedDocs = await prisma.candidateDocument.findMany({
    where: { status: 'failed' }
  });
  
  if (failedDocs.length === 0) {
    console.log("No failed documents to requeue.");
    return;
  }
  
  console.log(`Requeueing ${failedDocs.length} failed documents...`);
  
  const res = await fetch(`http://localhost:3001/api/upload/queue/requeue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentIds: failedDocs.map(d => d.id) })
  });
  
  console.log(await res.json());
}
test().catch(console.error);
