// app/api/student/materials/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role?.toUpperCase() !== "STUDENT") {
      console.log("[Materials API] Unauthorized - Role:", session?.user?.role || "none");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fix: Safely access grade with proper typing
    const user = session.user as { id: string; email?: string; role: string; fullName?: string; schoolId?: string; grade?: string };
    const studentGrade = user.grade;

    if (!studentGrade) {
      console.log("[Materials API] No grade found for student");
      return NextResponse.json([]); // Return empty array instead of error
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

    console.log(`[Materials API] ✅ Returned ${materials.length} materials for grade ${studentGrade}`);

    return NextResponse.json(materials);
  } catch (error) {
    console.error("[Materials API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 });
  }
}