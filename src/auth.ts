import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Nodemailer from "next-auth/providers/nodemailer";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { UserRole } from "@/db/schema";
import { authConfig } from "./auth.config";

type UserLike = { role?: UserRole; id?: string };

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(creds) {
      const email = String(creds?.email || "").trim().toLowerCase();
      const password = String(creds?.password || "");
      if (!email || !password) return null;
      const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const user = rows[0];
      if (!user || !user.passwordHash) return null;
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name || user.email,
        image: user.image,
        role: user.role,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google({ allowDangerousEmailAccountLinking: true }));
}
if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
  providers.push(Apple);
}
if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
  providers.push(
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        const u = user as UserLike;
        token.role = u.role ?? "user";
        token.id = u.id ?? token.sub;
        token.roleCheckedAt = Date.now();
      } else if (token.email) {
        const checkedAt = typeof token.roleCheckedAt === "number" ? token.roleCheckedAt : 0;
        const stale = Date.now() - checkedAt > 60 * 60 * 1000;
        if (!token.role || trigger === "update" || stale) {
          const rows = await db
            .select({ role: users.role, id: users.id })
            .from(users)
            .where(eq(users.email, String(token.email)))
            .limit(1);
          if (rows[0]) {
            token.role = rows[0].role;
            token.id = rows[0].id;
            token.roleCheckedAt = Date.now();
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as UserLike).role = (token.role as UserRole) ?? "user";
        (session.user as UserLike).id = typeof token.id === "string" ? token.id : undefined;
      }
      return session;
    },
  },
});
