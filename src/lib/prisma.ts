import { PrismaClient } from '@prisma/client';

// Global prisma instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Only create PrismaClient if DATABASE_URL is set AND we're not in build
const isBuild = process.env.NEXT_PHASE === 'phase-production-build' || 
                process.env.VERCEL_ENV === 'preview' && !process.env.DATABASE_URL;

export const prisma = globalForPrisma.prisma ?? 
  (isBuild ? null as any : new PrismaClient());

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}

export default prisma;