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

    const reports = await db.findMany({
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

    return NextResponse.json(reports);
  } catch (error) {
    console.error("[Reports API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
