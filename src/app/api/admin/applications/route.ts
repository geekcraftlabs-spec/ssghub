import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();

  if (!session || session.user?.role !== 'ADMIN' || !session.user.schoolId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const applications = await prisma.application.findMany({
    where: { 
      status: 'PENDING',
      schoolId: session.user.schoolId   // ← This is the key line
    },
    include: { 
      school: true 
    },
  });

  console.log(`✅ Returned ${applications.length} pending applications for school ${session.user.schoolId} (Admin: ${session.user.email})`);

  return NextResponse.json(applications);
}