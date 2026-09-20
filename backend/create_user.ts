import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin', 10);
  await prisma.user.upsert({
    where: { email: 'admin@hireflow.com' },
    update: { password },
    create: {
      email: 'admin@hireflow.com',
      name: 'Admin User',
      password,
      role: 'admin',
    },
  });
  console.log("Admin user created! email: admin@hireflow.com, password: admin");
}

main().catch(console.error).finally(() => prisma.$disconnect());
