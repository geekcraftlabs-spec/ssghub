import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            <span className="block text-[#1a365d]">Sandton Group of Schools</span>
            <span className="block mt-2 text-3xl font-medium text-gray-600 sm:text-4xl">
              Complete School Management Platform
            </span>
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-700">
            Access reports, learning materials, behavior tracking, and more — all in one secure platform.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto bg-[#1a365d] hover:bg-[#2b6cb0]">
              <Link href="/login">Log In to Portal</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="https://sandtonschoolgroup.vercel.app/subscribe">Subscribe</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Choose Your Path - User Portals */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Choose Your Portal
          </h2>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Student */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">Student</CardTitle>
                <CardDescription className="text-sm">
                  Report cards, notes & learning materials
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button asChild variant="outline" className="w-full mt-4">
                  <Link href="/login?as=student">Log In as Student</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Parent */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">Parent / Guardian</CardTitle>
                <CardDescription className="text-sm">
                  Track your child&apos;s progress
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button asChild variant="outline" className="w-full mt-4">
                  <Link href="/login?as=parent">Log In as Parent</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Teacher */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">Teacher</CardTitle>
                <CardDescription className="text-sm">
                  Upload reports, materials & behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button asChild variant="outline" className="w-full mt-4">
                  <Link href="/login?as=teacher">Log In as Teacher</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-[#1a365d] py-12 text-white text-center">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-lg max-w-2xl mx-auto">
            Log in to access your student, parent, or teacher portal.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8">
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}