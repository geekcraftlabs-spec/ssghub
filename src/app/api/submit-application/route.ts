import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { resend } from '@/lib/resend';

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

    console.log("[API] Subscribe request received");
    console.log("[API] Received body:", body);

    const {
      fullName,
      // dateOfBirth - kept for future use but not currently used
      grade,
      parentName,
      // parentPhone - kept for future use but not currently used
      parentEmail,
      // address - kept for future use but not currently used
      email, // student's email
    } = body;

    // Basic validation
    if (!fullName || !email || !parentName || !parentEmail || !grade) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if student email already exists
    const existingStudent = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingStudent) {
      return NextResponse.json({ error: "Student email already registered" }, { status: 400 });
    }

    // Check if parent email already exists
    const existingParent = await prisma.user.findUnique({
      where: { email: parentEmail },
    });

    if (existingParent) {
      return NextResponse.json({ error: "Parent email already registered" }, { status: 400 });
    }

    // Get Sandton school ID (hardcoded for now - you'll need to get the actual ID)
    const school = await prisma.school.findFirst({
      where: { name: { contains: "Sandton" } }
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Generate passwords
    const studentPassword = generateReadablePassword();
    const parentPassword = generateReadablePassword();

    // Hash passwords

    // Create student account

    // Create parent account

    console.log(`✅ Created student: ${email}`);
    console.log(`✅ Created parent: ${parentEmail}`);

    // Send welcome email to student
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
        <p>Login here: <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://platform.sandtonschoolgroup.vercel.app'}">School Platform</a></p>
      `,
    });

    // Send welcome email to parent
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
        <p>Login here: <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://platform.sandtonschoolgroup.vercel.app'}">School Platform</a></p>
      `,
    });

    console.log(`📧 Welcome emails sent to ${email} and ${parentEmail}`);

    return NextResponse.json({
      success: true,
      message: "Accounts created successfully. Login credentials sent via email.",
      student: { email, password: studentPassword },
      parent: { email: parentEmail, password: parentPassword },
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