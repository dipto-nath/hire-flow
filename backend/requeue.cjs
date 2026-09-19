const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find documents that need processing (status = 'processing' or 'ready' but no extracted text processed)
  const docs = await prisma.candidateDocument.findMany({
    where: {
      OR: [
        { status: 'processing' },
        { status: 'ready', extractedText: { not: '' } }
      ],
      type: 'resume'
    },
    include: { candidate: { select: { id: true, jobId: true } } }
  });
  
  console.log(`Found ${docs.length} documents to re-queue`);
  
  for (const doc of docs) {
    console.log(`Re-queueing: ${doc.id} (${doc.name}) for candidate ${doc.candidateId}`);
    console.log(`  documentId: ${doc.id}`);
    console.log(`  candidateId: ${doc.candidateId}`);
    console.log(`  jobId: ${doc.candidate.jobId}`);
    console.log(`  filePath: ${doc.filePath}`);
    console.log(`  mimeType: ${doc.type === 'resume' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}`);
    console.log(`  documentType: ${doc.type}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());