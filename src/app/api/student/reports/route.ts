// app/api/student/reports/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role?.toUpperCase() !== "STUDENT") {
      console.log("[Reports API] Unauthorized - Role:", session?.user?.role || "none");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reports = await prisma.reportCard.findMany({
      where: { 
        studentId: session.user.id 
      },
      orderBy: { uploadedAt: "desc" },
      select: { 
        id: true, 
        title: true, 
        fileUrl: true, 
        term: true,
        uploadedAt: true 
      }
    });

    console.log(`[Reports API] ✅ Returned ${reports.length} reports for student ${session.user.id}`);

    return NextResponse.json(reports);
  } catch (error) {
    console.error("[Reports API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}