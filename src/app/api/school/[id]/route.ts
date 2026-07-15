import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: schoolId } = await params;

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    // Try to find school
    const school = await db.findOne("schools", { id: schoolId });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json({ id: school.id, name: school.name });
  } catch (error) {
    console.error("Error fetching school by ID:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}