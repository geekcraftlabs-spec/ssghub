// app/student/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import StudentClient from "./StudentClient";

export default async function StudentPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  // Pre-fetch school name on server
  let schoolName = "Your School";
  const schoolId = session.user.schoolId as string | undefined;

  if (schoolId) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const schoolRes = await fetch(`${baseUrl}/api/student/school?schoolId=${schoolId}`, {
        cache: "no-store",
      });

      if (schoolRes.ok) {
        const data = await schoolRes.json();
        schoolName = data.name || "Your School";
      }
    } catch (e) {
      console.error("Failed to fetch school name on server:", e);
    }
  }

  return <StudentClient initialSession={session} initialSchoolName={schoolName} />;
}