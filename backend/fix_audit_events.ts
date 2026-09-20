import { PrismaClient } from '@prisma/client';
async function run() {
  const prisma = new PrismaClient();
  const events = await prisma.auditEvent.findMany({
    where: { action: 'Extracted evidence against requirement' }
  });

  let count = 0;
  for (const event of events) {
    if (!event.evidenceTrace) continue;
    
    // Check if it's in the old format
    const trace = event.evidenceTrace as any;
    if (trace.requirementId && !trace.extractedEvidence) {
      
      // Look up the requirement and evidence to populate the missing fields
      let requirementLabel = 'Unknown Requirement';
      if (trace.requirementId) {
        const req = await prisma.requirement.findUnique({ where: { id: trace.requirementId } });
        if (req) requirementLabel = req.label;
      }

      let extractedEvidence = 'No evidence found';
      if (event.candidateId && trace.requirementId) {
        const evidence = await prisma.evidence.findFirst({
          where: { candidateId: event.candidateId, requirementId: trace.requirementId }
        });
        if (evidence) extractedEvidence = evidence.excerpt;
      }

      const newTrace = {
        insight: event.insight,
        sourceDocument: event.sourceLabel,
        location: trace.location || 'N/A',
        extractedEvidence,
        reasoningContext: event.insight,
        requirementLabel
      };

      await prisma.auditEvent.update({
        where: { id: event.id },
        data: { evidenceTrace: newTrace }
      });
      count++;
    }
  }
  console.log(`Fixed ${count} audit events!`);
}
run().catch(console.error);
