// app/api/teacher/behavior/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await auth();

    // 🔐 Auth check
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🚨 EXTRA SAFETY (prevents Prisma crash)
    if (!session.user.id) {
      return NextResponse.json({ error: "User ID missing in session" }, { status: 401 });
    }

    const { studentId, date, description, severity } = await request.json();

    if (!studentId || !date || !description?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, date, description" },
        { status: 400 }
      );
    }

    const behavior = await prisma.behaviorReport.create({
      data: {
        date: new Date(date),
        description: description.trim(),
        severity: severity || null,
        uploadedBy: session.user.id,
        studentId: studentId,
      } as Prisma.BehaviorReportUncheckedCreateInput,
    });

    return NextResponse.json({ success: true, behavior });

  } catch (error) {
    console.error("[Behavior Upload] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to save behavior report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}