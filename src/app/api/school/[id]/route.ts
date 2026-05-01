// src/app/api/school/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // IMPORTANT: Await the params Promise (Next.js 16 requirement)
    const { id: schoolId } = await params;

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { 
        id: true,
        name: true 
      },
    });

    if (!school) {
      console.log(`School not found with ID: ${schoolId}`);
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json(school);
  } catch (error) {
    console.error("Error fetching school by ID:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}