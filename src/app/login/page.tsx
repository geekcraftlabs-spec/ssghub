"use client";

import { useState, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();

  const initialRole = (() => {
    const asParam = searchParams.get("as") as
      | "admin"
      | "teacher"
      | "student"
      | "parent"
      | null;

    if (asParam && ["admin", "teacher", "student", "parent"].includes(asParam)) {
      return asParam;
    }
    return "student";
  })();

  const [loginAs, setLoginAs] = useState<"admin" | "teacher" | "student" | "parent">(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Invalid credentials. Please check your email and password.");
      setIsLoading(false);
      return;
    }

    try {
      await update();
      await new Promise((resolve) => setTimeout(resolve, 300));

      const sessionRes = await fetch("/api/auth/session", {
        cache: "no-store",
      });

      const sessionData = await sessionRes.json();
      const role = sessionData?.user?.role?.toUpperCase();

      if (role === "ADMIN") {
        router.push("/admin");
      } else if (role === "TEACHER") {
        router.push("/teacher");
      } else if (role === "STUDENT") {
        if (loginAs === "parent") {
          router.push("/parent");
        } else {
          router.push("/student");
        }
      } else {
        router.push("/login");
      }

      router.refresh();
    } catch (err) {
      console.error("Post-login refresh failed:", err);
      router.refresh();
    }

    setIsLoading(false);
  }

  const getButtonStyle = (role: string) => {
    const isActive = loginAs === role;

    if (role === "admin") {
      return isActive
        ? "bg-red-600 hover:bg-red-700 text-white shadow-sm"
        : "bg-red-100 hover:bg-red-200 text-red-700";
    }

    if (role === "teacher") {
      return isActive
        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        : "bg-emerald-100 hover:bg-emerald-200 text-emerald-700";
    }

    return isActive
      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
      : "bg-blue-100 hover:bg-blue-200 text-blue-700";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Log In to RuzivoStas</h2>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 underline">
            ← Return to Home
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-sm font-medium text-gray-600 mb-3">
            I am logging in as:
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setLoginAs("student")} className={`py-3 px-4 rounded-lg font-medium transition-all ${getButtonStyle("student")}`}>Student</button>
            <button type="button" onClick={() => setLoginAs("parent")} className={`py-3 px-4 rounded-lg font-medium transition-all ${getButtonStyle("parent")}`}>Parent</button>
            <button type="button" onClick={() => setLoginAs("admin")} className={`py-3 px-4 rounded-lg font-medium transition-all ${getButtonStyle("admin")}`}>Admin</button>
            <button type="button" onClick={() => setLoginAs("teacher")} className={`py-3 px-4 rounded-lg font-medium transition-all ${getButtonStyle("teacher")}`}>Teacher</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="border p-3 w-full rounded"
            required
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="border p-3 w-full rounded"
            required
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white p-3 w-full rounded"
          >
            {isLoading
              ? "Logging in..."
              : `Log In as ${loginAs.charAt(0).toUpperCase() + loginAs.slice(1)}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}