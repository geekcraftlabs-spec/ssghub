import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
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
    const { applicationId } = await request.json();

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { school: true },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: application.applicantEmail }
    });

    if (existingUser) {
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'APPROVED' },
      });
      return NextResponse.json({ success: true, message: 'Application approved (user already existed)' });
    }

    const randomPassword = generateReadablePassword();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        email: application.applicantEmail,
        password: hashedPassword,
        fullName: application.fullName,
        role: 'STUDENT',
        grade: application.grade,
        schoolId: application.schoolId,
      },
    });

    console.log(`✅ New STUDENT created: ${newUser.fullName} (${newUser.grade || 'No grade'}) in school ${newUser.schoolId}`);

    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'APPROVED' },
    });

    // === EMAIL FORCED TO TEST ADDRESS ===
    const emailHtml = `
      <h1>Welcome to RuzivoStas, ${application.fullName}!</h1>
      <p>Your application has been approved.</p>
      <p><strong>Login Details (Student & Parent use same account):</strong></p>
      <ul>
        <li><strong>Email:</strong> ${application.applicantEmail}</li>
        <li><strong>Password:</strong> ${randomPassword}</li>
        <li><strong>School:</strong> ${application.school?.name || 'N/A'}</li>
        <li><strong>Grade:</strong> ${application.grade || 'Not specified'}</li>
      </ul>
      <p>Login here: <a href="http://localhost:3000/login">RuzivoStas Login</a></p>
      <p><em>This email was sent to geekcraftlabs@gmail.com for testing purposes.</em></p>
    `;

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'geekcraftlabs@gmail.com',           // ← Forced to your test email
      subject: `Welcome to RuzivoStas - ${application.fullName}`,
      html: emailHtml,
    });

    console.log(`📧 Welcome email sent to geekcraftlabs@gmail.com for student: ${application.applicantEmail} | Password: ${randomPassword}`);

    return NextResponse.json({ 
      success: true, 
      message: `Student approved successfully! Password: ${randomPassword}` 
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("💥 [Approve API] Error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}