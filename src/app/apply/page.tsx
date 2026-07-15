import { redirect } from "next/navigation";

export default async function ApplyPage() {
  const mainSiteUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || "https://sandtonschoolgroup.vercel.app";
  redirect(`${mainSiteUrl}/subscribe`);
}