"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";   // ← added useSession
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();   // ← for forcing refresh

  const initialRole = (() => {
    const asParam = searchParams.get("as") as "admin" | "teacher" | "student" | "parent" | null;
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

    // === FORCE SESSION UPDATE (this fixes the stuck loading) ===
    try {
      await update();                    // Refresh client session context
      await new Promise(resolve => setTimeout(resolve, 300)); // Small breathing room

      const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
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

      router.refresh();   // ← Critical: forces re-render with fresh session
    } catch (err) {
      console.error("Post-login refresh failed:", err);
      router.refresh();   // fallback
    }

    setIsLoading(false);
  }

  // ... rest of your component (role selector, form, getButtonStyle) stays exactly the same
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

        {/* Role Selector - unchanged */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-600 mb-3">I am logging in as:</p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setLoginAs("student")} className={`py-3 px-4 rounded-lg font-medium transition-all ${getButtonStyle("student")}`}>Student</button>
            <button type="button" onClick={() => setLoginAs("parent")} className={`py-3 px-4 rounded-lg font-medium transition-all ${getButtonStyle("parent")}`}>Parent</button>
            <button type="button" onClick={() => setLoginAs("admin")} className={`py-3 px-4 rounded-lg font-medium transition-all ${getButtonStyle("admin")}`}>Admin</button>
            <button type="button" onClick={() => setLoginAs("teacher")} className={`py-3 px-4 rounded-lg font-medium transition-all ${getButtonStyle("teacher")}`}>Teacher</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="border p-3 w-full rounded focus:outline-none focus:border-blue-500" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="border p-3 w-full rounded focus:outline-none focus:border-blue-500" required />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 w-full rounded font-medium disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Logging in..." : `Log In as ${loginAs.charAt(0).toUpperCase() + loginAs.slice(1)}`}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          Don&apos;t have an account? Contact your school admin.
        </div>
      </div>
    </div>
  );
}