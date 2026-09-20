import { prisma } from './src/config/database.js';
async function main() {
  const count = await prisma.candidateSummary.count();
  console.log('Summaries:', count);
}
main();
