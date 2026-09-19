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

export async function uploadRoutes(app: FastifyInstance) {
  // POST /api/upload/document - Upload candidate document
  app.post('/document', async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    const { candidateId, type } = data.fields as { candidateId: string; type: string };
    
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
      if (data.mimetype === 'application/pdf') {
        const pdfBuffer = await data.file;
        const pdfData = await pdfParse(pdfBuffer);
        extractedText = pdfData.text;
      } else if (data.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const docBuffer = await data.file;
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

    // Trigger AI processing (async)
    processDocumentAsync(document.id, candidateId, candidate.jobId, extractedText, parsed.data.type);

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
}

async function processDocumentAsync(
  documentId: string,
  candidateId: string,
  jobId: string,
  text: string,
  documentType: string
) {
  try {
    // Update status to processing
    await prisma.candidateDocument.update({
      where: { id: documentId },
      data: { status: 'processing' },
    });

    // Import AI service dynamically to avoid circular dependencies
    const { aiService } = await import('../services/aiService.js');
    
    // Process document with AI
    await aiService.processDocument(documentId, candidateId, jobId, text, documentType);

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