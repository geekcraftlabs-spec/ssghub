import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { uploadToSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.id) {
      return NextResponse.json({ error: "User ID missing in session" }, { status: 401 });
    }

    const formData = await request.formData();

    const file = formData.get("file") as File;
    const studentId = formData.get("studentId") as string;
    const term = formData.get("term") as string;
    const year = formData.get("year") as string;
    const title = formData.get("title") as string;

    if (!file || !studentId || !term || !year || !title) {
      return NextResponse.json(
        { error: "Missing required fields: file, studentId, term, year, title" },
        { status: 400 }
      );
    }

    const fileName = `reports/${studentId}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const fileUrl = await uploadToSupabase(file, fileName);

    const report = await prisma.reportCard.create({
      data: {
        fileUrl,
        term,
        year: parseInt(year),
        title,
        studentId,
        uploadedBy: session.user.id,
      },
    });

    return NextResponse.json({ success: true, report });

  } catch (error) {
    console.error("[Upload Report] Error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}