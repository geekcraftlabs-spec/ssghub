// test-db.ts
import 'dotenv/config'; // ← Loads .env so DATABASE_URL is available

import prisma from './lib/prisma';  // ← single import, no duplicate, no .ts extension

async function testConnection() {
  try {
    console.log('DATABASE_URL loaded:', process.env.DATABASE_URL ? 'YES' : 'NO');
    await prisma.$connect();
    console.log('Connection SUCCESS!');
    const provinces = await prisma.province.findMany();
    console.log('Provinces count:', provinces.length);
  } catch (e) {
    console.error('Connection FAILED:', e);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();