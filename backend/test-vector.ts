import { prisma } from './src/config/database.js';

async function main() {
  try {
    const res = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('DB Connection OK:', res);
    const vectorRes = await prisma.$queryRaw`SELECT '[1,2,3]'::vector as vec`;
    console.log('Vector Extension OK:', vectorRes);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
