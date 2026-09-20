import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const candidates = await prisma.candidate.findMany({
    include: { job: true }
  });
  
  console.log(`Found ${candidates.length} total candidates`);
  
  console.log(`Deleting all candidates from database...`);
  
  if (candidates.length > 0) {
    await prisma.candidate.deleteMany({});
    
    // reset job counts
    await prisma.job.updateMany({
      data: { candidateCount: 0 }
    });
  }
  
  // Clear out the uploads folder (keep .gitkeep if it exists)
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    let deletedCount = 0;
    for (const file of files) {
      if (file !== '.gitkeep') {
        fs.unlinkSync(path.join(uploadsDir, file));
        deletedCount++;
      }
    }
    console.log(`Deleted ${deletedCount} CV files from the uploads folder.`);
  }

  console.log('Done! Database and uploads folder are clean. Jobs are kept intact.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
