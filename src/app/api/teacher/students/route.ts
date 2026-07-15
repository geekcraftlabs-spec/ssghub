import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId");

  if (!schoolId) {
    return NextResponse.json({ error: "schoolId is required" }, { status: 400 });
  }

  try {
    const students = await prisma.user.findMany({
      where: {
        schoolId,
        role: "STUDENT",
      },
      select: {
        id: true,
        fullName: true,
        grade: true,
      },
      orderBy: {
        fullName: "asc",
      },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching teacher students:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}