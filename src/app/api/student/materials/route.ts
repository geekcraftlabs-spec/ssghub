import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role?.toUpperCase() !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id: string; email?: string; role: string; fullName?: string; schoolId?: string; grade?: string };
    const studentGrade = user.grade;

    if (!studentGrade) {
      return NextResponse.json([]);
    }

    const materials = await prisma.material.findMany({
      where: { 
        grade: studentGrade 
      },
      orderBy: { uploadedAt: "desc" },
      select: { 
        id: true, 
        title: true, 
        fileUrl: true, 
        subject: true, 
        grade: true,
        uploadedAt: true 
      }
    });

    return NextResponse.json(materials);
  } catch (error) {
    console.error("[Materials API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 });
  }
}