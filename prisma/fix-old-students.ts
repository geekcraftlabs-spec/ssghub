// prisma/fix-old-students.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in .env');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔧 Fixing older students with missing or empty passwords...');

  // Get all STUDENT users
  const allStudents = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      email: true,
      fullName: true,
      password: true,
    }
  });

  // Filter students with no password or empty password
  const usersToFix = allStudents.filter(user => 
    !user.password || user.password.trim() === ''
  );

  console.log(`Found ${usersToFix.length} students to fix.`);

  for (const user of usersToFix) {
    const randomPassword = 'TempPass' + Math.floor(1000 + Math.random() * 9000);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword 
      },
    });

    console.log(`✅ Fixed: ${user.email} (${user.fullName || 'No name'}) → Temp password: ${randomPassword}`);
  }

  if (usersToFix.length === 0) {
    console.log('✅ No students needed fixing. All good!');
  } else {
    console.log(`🎉 Successfully fixed ${usersToFix.length} old students.`);
  }
}

main()
  .catch((e) => console.error('❌ Error running fix script:', e))
  .finally(async () => await prisma.$disconnect());