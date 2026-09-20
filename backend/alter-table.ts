import { prisma } from './src/config/database.js';

async function main() {
  try {
    await prisma.$executeRaw`ALTER TABLE "CandidateSummary" ALTER COLUMN "embedding" TYPE vector(3072);`;
    console.log('Successfully altered embedding column to vector(3072)');
  } catch (e) {
    console.error('Error altering table:', e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
