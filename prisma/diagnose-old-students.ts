// prisma/diagnose-old-students.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔍 Diagnosing old student accounts...\n');

  const oldStudents = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      grade: true,
      schoolId: true,
      password: true,        // We want to see if password exists
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Total STUDENT users found: ${oldStudents.length}\n`);

  oldStudents.forEach((user, index) => {
    console.log(`Student ${index + 1}:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  FullName: ${user.fullName || 'None'}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Grade: ${user.grade || 'None'}`);
    console.log(`  School ID: ${user.schoolId || 'None'}`);
    console.log(`  Has Password: ${!!user.password}`);
    console.log(`  Password Length: ${user.password ? user.password.length : 0}`);
    console.log(`  Created: ${user.createdAt}`);
    console.log('---');
  });

  if (oldStudents.length === 0) {
    console.log("No STUDENT users found in the database.");
  }
}

main()
  .catch(e => console.error('Error:', e))
  .finally(async () => await prisma.$disconnect());