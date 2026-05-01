import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  const email = "testadmin2@gmail.com";
  const password = "admin123";
  const fullName = "Test Admin 2";
  const schoolId = "7d7d6c35-cf0e-43a6-ba64-13e82926b274";   // Change if needed for the second school

  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("User already exists. Updating schoolId...");
    await prisma.user.update({
      where: { email },
      data: { schoolId, fullName }
    });
    console.log("Updated successfully");
    return;
  }

  const newAdmin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName,
      role: "ADMIN",
      schoolId,
    },
  });

  console.log("✅ New admin created successfully!");
  console.log("ID:", newAdmin.id);
  console.log("Email:", newAdmin.email);
  console.log("SchoolId:", newAdmin.schoolId);
}

createAdmin()
  .catch(console.error)
  .finally(() => process.exit(0));