import { NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role?.toUpperCase() !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const behaviorReports = await db.findMany({
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

    return NextResponse.json(behaviorReports);
  } catch (error) {
    console.error("[Behavior API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch behavior reports" }, { status: 500 });
  }
}
