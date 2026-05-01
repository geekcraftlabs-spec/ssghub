// src/app/apply/page.tsx
import prisma from '@/lib/prisma';  // ← import the singleton
import ClientApplyForm from './ClientApplyForm';

export default async function ApplyPage() {
  const provinces = await prisma.province.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const allSchools = await prisma.school.findMany({
    select: { id: true, name: true, provinceId: true },
    orderBy: { name: 'asc' },
  });

  return <ClientApplyForm provinces={provinces} allSchools={allSchools} />;
}