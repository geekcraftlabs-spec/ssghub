// app/api/student/behavior/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role?.toUpperCase() !== "STUDENT") {
      console.log("[Behavior API] Unauthorized - Role:", session?.user?.role || "none");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const behaviorReports = await prisma.behaviorReport.findMany({
      where: { 
        studentId: session.user.id 
      },
      orderBy: { date: "desc" },
      select: { 
        id: true, 
        date: true, 
        description: true, 
        severity: true,
        uploadedAt: true 
      }
    });

    console.log(`[Behavior API] ✅ Returned ${behaviorReports.length} behavior reports`);

    return NextResponse.json(behaviorReports);
  } catch (error) {
    console.error("[Behavior API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch behavior reports" }, { status: 500 });
  }
}