import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ParentClient from "./ParentClient";

export default async function ParentPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  return <ParentClient initialSession={session} />;
}