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
    const grade = formData.get("grade") as string;
    const subject = formData.get("subject") as string;
    const title = formData.get("title") as string;

    if (!file || !grade || !subject || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const fileName = `materials/${grade}/${subject}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const fileUrl = await uploadToSupabase(file, fileName);

    const material = await prisma.material.create({
      data: {
        grade,
        subject,
        title,
        fileUrl,
        uploadedBy: session.user.id,
      },
    });

    return NextResponse.json({ success: true, material });

  } catch (error) {
    console.error("[Upload Material] Error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}