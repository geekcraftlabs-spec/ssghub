import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { resend } from '@/lib/resend';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

function generateReadablePassword(): string {
  const adjectives = ['Blue', 'Bright', 'Smart', 'Golden', 'Silver', 'Happy', 'Swift'];
  const nouns = ['Sky', 'River', 'Mountain', 'Eagle', 'Lion', 'Star', 'Cloud'];
  const number = Math.floor(100 + Math.random() * 900);
  return adjectives[Math.floor(Math.random() * adjectives.length)] +
         nouns[Math.floor(Math.random() * nouns.length)] +
         number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      fullName,
      grade,
      parentName,
      parentEmail,
      email,
    } = body;

    if (!fullName || !email || !parentName || !parentEmail || !grade) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingStudent = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingStudent) {
      return NextResponse.json({ error: "Student email already registered" }, { status: 400 });
    }

    const existingParent = await prisma.user.findUnique({
      where: { email: parentEmail },
    });

    if (existingParent) {
      return NextResponse.json({ error: "Parent email already registered" }, { status: 400 });
    }

    const school = await prisma.school.findFirst({
      where: { name: { contains: "Sandton" } }
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const studentPassword = generateReadablePassword();
    const parentPassword = generateReadablePassword();

    const hashedStudentPassword = await bcrypt.hash(studentPassword, 10);
    const hashedParentPassword = await bcrypt.hash(parentPassword, 10);

    await prisma.user.create({
      data: {
        email: email,
        password: hashedStudentPassword,
        fullName: fullName,
        role: 'STUDENT',
        grade: grade,
        schoolId: school.id,
      },
    });

    await prisma.user.create({
      data: {
        email: parentEmail,
        password: hashedParentPassword,
        fullName: parentName,
        role: 'PARENT',
        schoolId: school.id,
      },
    });

    // Only send emails if Resend is available
    if (resend) {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Welcome to Sandton School Platform',
        html: `
          <h1>Welcome to Sandton Group of Schools!</h1>
          <p><strong>Your account has been created.</strong></p>
          <p><strong>Login Details:</strong></p>
          <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Password:</strong> ${studentPassword}</li>
          </ul>
          <p>Login here: <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://sandton-platform.vercel.app'}/login">School Platform</a></p>
        `,
      });

      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: parentEmail,
        subject: 'Welcome to Sandton School Platform - Parent Access',
        html: `
          <h1>Welcome to Sandton Group of Schools!</h1>
          <p><strong>Your parent account has been created.</strong></p>
          <p><strong>Login Details:</strong></p>
          <ul>
            <li><strong>Email:</strong> ${parentEmail}</li>
            <li><strong>Password:</strong> ${parentPassword}</li>
          </ul>
          <p><strong>Your child:</strong> ${fullName} (${grade})</p>
          <p>Login here: <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://sandton-platform.vercel.app'}/login">School Platform</a></p>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Accounts created successfully. Login credentials sent via email.",
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[API] Error creating accounts:", error);
    return NextResponse.json({
      error: "Failed to create accounts",
      details: errorMessage
    }, { status: 500 });
  }
}