import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import db from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      email?: string;
      role: string;
      fullName?: string;
      schoolId?: string;
      grade?: string;
    };
  }
  interface User {
    id: string;
    role: string;
    fullName?: string;
    schoolId?: string;
    grade?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || typeof credentials.email !== "string" ||
            !credentials?.password || typeof credentials.password !== "string") {
          return null;
        }

        try {
          const user = await db.findOne("users", { email: credentials.email });

          if (!user || !user.password) return null;

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            fullName: user.full_name || undefined,
            schoolId: user.school_id || undefined,
            grade: user.grade || undefined,
          };
        } catch (error) {
          console.error("💥 Error in authorize():", error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        if (user.fullName) token.fullName = user.fullName;
        if (user.schoolId) token.schoolId = user.schoolId;
        if (user.grade) token.grade = user.grade;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        if (token.fullName) session.user.fullName = token.fullName as string;
        if (token.schoolId) session.user.schoolId = token.schoolId as string;
        if (token.grade) session.user.grade = token.grade as string;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
});