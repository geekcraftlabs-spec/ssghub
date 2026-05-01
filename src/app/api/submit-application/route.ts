import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { resend } from '@/lib/resend';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("[API] Submit application – request received");
    console.log("[API] Received body:", body);

    const {
      fullName,
      dateOfBirth,
      grade,
      previousSchool,
      parentName,
      parentPhone,
      parentEmail,     // ← NEW
      address,
      email,           // student's email
      province,
      school,
    } = body;

    // Basic validation
    if (!fullName || !email || !province || !school || !parentEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log("[API] Creating Application record...");

    const application = await prisma.application.create({
      data: {
        fullName,
        dateOfBirth: new Date(dateOfBirth),
        grade,
        previousSchool: previousSchool || null,
        parentName,
        parentPhone,
        parentEmail,           // ← NEW: saved to database
        address,
        applicantEmail: email, // student's email
        provinceId: province,
        schoolId: school,
        status: 'PENDING',
      },
    });

    console.log("[API] Application created successfully – ID:", application.id);

    // Send confirmation email to your test address
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'geekcraftlabs@gmail.com',
      subject: 'New School Application Received',
      html: `
        <h1>New Application Received</h1>
        <p><strong>Student:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Parent Email:</strong> ${parentEmail}</p>
        <p><strong>School:</strong> ${school}</p>
        <p>Go to the admin dashboard to review and approve.</p>
      `,
    });

    console.log("[API] Email notification sent successfully");

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      applicationId: application.id,
    });

  } catch (error: any) {
    console.error("[API] Error submitting application:", error);
    return NextResponse.json({ 
      error: "Failed to submit application",
      details: error.message 
    }, { status: 500 });
  }
}