import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
  user?: {
    id: string;
    email?: string;
    role: string;
    fullName?: string;
    schoolId?: string;
    grade?: string; // ✅ ADD
  };
}
  interface User {
  id: string;
  role: string;
  fullName?: string;
  schoolId?: string;
  grade?: string; // ✅ ADD
}

  interface JWT {
    sub?: string; // ✅ THIS HOLDS USER ID
    role: string;
    fullName?: string;
    schoolId?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // @ts-expect-error Workaround for v5 PrismaAdapter type mismatch
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 === LOGIN ATTEMPT START ===");

        if (
          !credentials?.email ||
          typeof credentials.email !== "string" ||
          !credentials?.password ||
          typeof credentials.password !== "string"
        ) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.password) return null;

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValid) return null;

          return {
  id: user.id,
  email: user.email,
  role: user.role,
  fullName: user.fullName || undefined,
  schoolId: user.schoolId || undefined,
  grade: user.grade || undefined, // ✅ ADD THIS
};
        } catch (error) {
          console.error("💥 Error in authorize():", error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
  },

  callbacks: {
    async jwt({ token, user }) {
      // ✅ THIS IS THE KEY FIX
      if (user) {
  token.sub = user.id;
  token.role = user.role;
  if (user.fullName) token.fullName = user.fullName;
  if (user.schoolId) token.schoolId = user.schoolId;
  if (user.grade) token.grade = user.grade; // ✅ ADD
}
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
  session.user.id = token.sub as string;
  session.user.role = token.role as string;

  if (token.fullName)
    session.user.fullName = token.fullName as string;

  if (token.schoolId)
    session.user.schoolId = token.schoolId as string;

  if (token.grade)
    session.user.grade = token.grade as string; // ✅ ADD
}
      return session;
    },
  },

  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
});