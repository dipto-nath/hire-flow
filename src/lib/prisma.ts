// Mock Prisma client for frontend - not actually used, just for type compatibility
// The actual Prisma client runs in the backend

export const prisma = {
  user: {
    findUnique: async () => null,
    create: async () => null,
    update: async () => null,
    delete: async () => null,
  },
  job: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => null,
    update: async () => null,
    delete: async () => null,
  },
  candidate: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => null,
    update: async () => null,
    delete: async () => null,
  },
  // Add other models as needed
};

export default prisma;