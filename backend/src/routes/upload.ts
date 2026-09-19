import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { uploadDocumentSchema } from '../schemas/index.js';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

// ─── Document Processing Queue (Concurrency Control) ──────────────────────────────
// Processes 1 document at a time with 20-second delay between each to respect
// Gemini Free Tier rate limit of 5 requests/minute (each doc needs ~3 requests)

interface QueuedDocument {
  documentId: string;
  candidateId: string;
  jobId: string;
  filePath: string;
  mimeType: string;
  documentType: string;
}

const documentQueue: QueuedDocument[] = [];
let isProcessingQueue = false;

const DELAY_BETWEEN_DOCUMENTS_MS = 20000; // 20 seconds

async function processQueue() {
  if (isProcessingQueue || documentQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;
  console.log(`[Queue] Starting processing. ${documentQueue.length} document(s) in queue.`);

  while (documentQueue.length > 0) {
    const queuedDoc = documentQueue.shift()!;
    console.log(`[Queue] Processing document ${queuedDoc.documentId} (${documentQueue.length} remaining)`);
    
    try {
      await processDocumentAsync(
        queuedDoc.documentId,
        queuedDoc.candidateId,
        queuedDoc.jobId,
        queuedDoc.filePath,
        queuedDoc.mimeType,
        queuedDoc.documentType
      );
    } catch (error) {
      console.error(`[Queue] Failed to process document ${queuedDoc.documentId}:`, error);
    }

    // Delay before processing next document to respect rate limits
    if (documentQueue.length > 0) {
      console.log(`[Queue] Waiting ${DELAY_BETWEEN_DOCUMENTS_MS}ms before next document...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_DOCUMENTS_MS));
    }
  }

  isProcessingQueue = false;
  console.log('[Queue] All documents processed.');
}

function enqueueDocument(doc: QueuedDocument) {
  documentQueue.push(doc);
  console.log(`[Queue] Document ${doc.documentId} enqueued. Queue length: ${documentQueue.length}`);
  
  // Trigger queue processing if not already running
  if (!isProcessingQueue) {
    // Use setImmediate to avoid blocking the response
    setImmediate(() => processQueue());
  }
}

export async function uploadRoutes(app: FastifyInstance) {
  // POST /api/upload/document - Upload candidate document
  app.post('/document', async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    const fields = data.fields as any;
    const candidateId = fields.candidateId?.value;
    const type = fields.type?.value;
    
    const parsed = uploadDocumentSchema.safeParse({ candidateId, type });
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    // Check if candidate exists
    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) {
      return reply.status(404).send({ error: 'Candidate not found' });
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), env.UPLOAD_DIR);
    const fileName = `${randomUUID()}-${data.filename}`;
    const filePath = join(uploadDir, fileName);

    // Save file
    await pipeline(data.file, createWriteStream(filePath));

    // Extract text based on file type
    let extractedText = '';
    try {
      const fs = await import('fs/promises');
      if (data.mimetype === 'application/pdf') {
        const pdfBuffer = await fs.readFile(filePath);
        const pdfData = await pdfParse(pdfBuffer);
        extractedText = pdfData.text;
      } else if (data.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const docBuffer = await fs.readFile(filePath);
        const result = await mammoth.extractRawText({ buffer: docBuffer });
        extractedText = result.value;
      }
    } catch (extractError) {
      console.error('Text extraction failed:', extractError);
    }

    // Create document record
    const document = await prisma.candidateDocument.create({
      data: {
        candidateId,
        name: data.filename,
        type: parsed.data.type as any,
        size: data.file.bytesRead,
        filePath,
        extractedText,
        status: 'ready',
      },
    });

    // Update candidate if this is a resume
    if (parsed.data.type === 'resume') {
      await prisma.candidate.update({
        where: { id: candidateId },
        data: { stage: 'screening' },
      });
    }

    // Enqueue document for sequential AI processing (respects Gemini rate limits)
    enqueueDocument({
      documentId: document.id,
      candidateId,
      jobId: candidate.jobId,
      filePath,
      mimeType: data.mimetype,
      documentType: parsed.data.type,
    });

    return reply.status(201).send(document);
  });

  // GET /api/upload/candidate/:candidateId/documents - Get candidate documents
  app.get('/candidate/:candidateId/documents', async (request) => {
    const { candidateId } = request.params as { candidateId: string };

    const documents = await prisma.candidateDocument.findMany({
      where: { candidateId },
      orderBy: { uploadedAt: 'desc' },
    });

    return documents;
  });

  // DELETE /api/upload/document/:id - Delete document
  app.delete('/document/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const document = await prisma.candidateDocument.findUnique({ where: { id } });
    if (!document) {
      return reply.status(404).send({ error: 'Document not found' });
    }

    // Delete file from filesystem
    try {
      const fs = await import('fs');
      fs.unlinkSync(document.filePath!);
    } catch (e) {
      console.error('Failed to delete file:', e);
    }

    await prisma.candidateDocument.delete({ where: { id } });

    return { success: true };
  });

  // GET /api/upload/queue/status - Get processing queue status
  app.get('/queue/status', async () => {
    return {
      queueLength: documentQueue.length,
      isProcessing: isProcessingQueue,
      queuedDocuments: documentQueue.map(d => ({
        documentId: d.documentId,
        candidateId: d.candidateId,
        documentType: d.documentType,
      })),
    };
  });

  // POST /api/upload/queue/requeue - Re-queue stuck documents
  app.post('/queue/requeue', async (request, reply) => {
    const { documentIds } = request.body as { documentIds: string[] };
    
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return reply.status(400).send({ error: 'documentIds array is required' });
    }

    const docs = await prisma.candidateDocument.findMany({
      where: { id: { in: documentIds } },
      include: { candidate: { select: { id: true, jobId: true } } }
    });

    let requeued = 0;
    for (const doc of docs) {
      if (doc.candidate && doc.filePath) {
        enqueueDocument({
          documentId: doc.id,
          candidateId: doc.candidateId,
          jobId: doc.candidate.jobId,
          filePath: doc.filePath,
          mimeType: doc.type === 'resume' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          documentType: doc.type,
        });
        requeued++;
      }
    }

    return { requeued, total: documentIds.length };
  });
}

async function processDocumentAsync(
  documentId: string,
  candidateId: string,
  jobId: string,
  filePath: string,
  mimeType: string,
  documentType: string
) {
  try {
    // Update status to processing
    await prisma.candidateDocument.update({
      where: { id: documentId },
      data: { status: 'processing' },
    });

    // Import AI service dynamically to avoid circular dependencies
    const aiService = await import('../services/aiService.js');
    
    // Process document with AI
    await aiService.processDocument(documentId, candidateId, jobId, filePath, mimeType, documentType);

    // Update status to ready
    await prisma.candidateDocument.update({
      where: { id: documentId },
      data: { status: 'ready' },
    });
  } catch (error) {
    console.error('Document processing failed:', error);
    await prisma.candidateDocument.update({
      where: { id: documentId },
      data: { status: 'failed' },
    });
  }
}