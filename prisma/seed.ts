// prisma/seed.ts
import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from "bcryptjs";

console.log('DATABASE_URL from env:', process.env.DATABASE_URL ? 'present' : 'MISSING');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in .env file');
}

const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...');

  try {
    // Provinces
    const provinces = [
      { name: 'Harare' },
      { name: 'Bulawayo' },
      { name: 'Manicaland' },
    ];

    for (const p of provinces) {
      await prisma.province.upsert({
        where: { name: p.name },
        update: {},
        create: p,
      });
    }
    console.log('Provinces seeded.');

    // Fetch province IDs
    const harare = await prisma.province.findUnique({ where: { name: 'Harare' } });
    const bulawayo = await prisma.province.findUnique({ where: { name: 'Bulawayo' } });
    const manicaland = await prisma.province.findUnique({ where: { name: 'Manicaland' } });

    if (!harare || !bulawayo || !manicaland) {
      throw new Error('One or more provinces not found after upsert');
    }

    // Schools (using the exact names and IDs you have)
    const rufaro = await prisma.school.upsert({
      where: { name: 'Rufaro Primary' },
      update: {},
      create: {
        name: 'Rufaro Primary',
        provinceId: harare.id,
      },
    });

    const kingGeorge = await prisma.school.upsert({
      where: { name: 'King George High' },
      update: {},
      create: {
        name: 'King George High',
        provinceId: bulawayo.id,
      },
    });

    const mzilikazi = await prisma.school.upsert({
      where: { name: 'Mzilikazi Secondary' },
      update: {},
      create: {
        name: 'Mzilikazi Secondary',
        provinceId: manicaland.id,
      },
    });

    console.log('Schools seeded.');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Existing test student (Rufaro Primary)
    await prisma.user.upsert({
      where: { email: 'teststudent@gmail.com' },
      update: {},
      create: {
        email: 'teststudent@gmail.com',
        password: hashedPassword,
        role: 'STUDENT',
        fullName: 'Test Student',
        schoolId: rufaro.id,
      },
    });
    console.log('Test student user seeded.');

    // Existing test admins
    const adminHashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
      where: { email: 'testadmin@gmail.com' },
      update: {},
      create: {
        email: 'testadmin@gmail.com',
        password: adminHashedPassword,
        role: 'ADMIN',
        fullName: 'Test Admin',
        schoolId: rufaro.id,
      },
    });
    console.log('Test admin (Rufaro) seeded.');

    await prisma.user.upsert({
      where: { email: 'testadmin2@gmail.com' },
      update: {
        schoolId: kingGeorge.id,
        fullName: 'Test Admin 2',
      },
      create: {
        email: 'testadmin2@gmail.com',
        password: adminHashedPassword,
        role: 'ADMIN',
        fullName: 'Test Admin 2',
        schoolId: kingGeorge.id,
      },
    });
    console.log('Test admin 2 (King George High) seeded.');

    // ==================== NEW: Teacher Accounts ====================

    await prisma.user.upsert({
      where: { email: 'teacher.kinggeorge@school.com' },
      update: {},
      create: {
        email: 'teacher.kinggeorge@school.com',
        password: hashedPassword,           // password123
        role: 'TEACHER',
        fullName: 'Mr. Sipho Ndlovu',
        schoolId: kingGeorge.id,            // King George High
      },
    });
    console.log('Teacher for King George High seeded.');

    await prisma.user.upsert({
      where: { email: 'teacher.mzilikazi@school.com' },
      update: {},
      create: {
        email: 'teacher.mzilikazi@school.com',
        password: hashedPassword,           // password123
        role: 'TEACHER',
        fullName: 'Mrs. Thandiwe Moyo',
        schoolId: mzilikazi.id,             // Mzilikazi Secondary
      },
    });
    console.log('Teacher for Mzilikazi Secondary seeded.');

    console.log('✅ Seed completed successfully!');
    console.log('\nTeacher Login Details:');
    console.log('→ King George High: teacher.kinggeorge@school.com / password123');
    console.log('→ Mzilikazi Secondary: teacher.mzilikazi@school.com / password123');

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});