// prisma/cleanup-students.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in .env');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  const keepEmail = "timare@gmail.com";

  console.log(`🗑️  Deleting all STUDENT users except ${keepEmail}...`);

  const deletedUsers = await prisma.user.deleteMany({
    where: {
      role: 'STUDENT',
      email: { not: keepEmail }
    }
  });

  console.log(`✅ Deleted ${deletedUsers.count} old student users.`);

  // Also clean up any leftover applications (except for timare)
  const deletedApps = await prisma.application.deleteMany({
    where: {
      applicantEmail: { not: keepEmail }
    }
  });

  console.log(`✅ Also deleted ${deletedApps.count} old application records.`);

  console.log('🎉 Cleanup completed. Only timare@gmail.com remains as a student.');
}

main()
  .catch((e) => console.error('❌ Error during cleanup:', e))
  .finally(async () => await prisma.$disconnect());