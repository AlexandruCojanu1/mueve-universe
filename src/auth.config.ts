import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/db/schema";

type UserLike = { role?: UserRole; id?: string };

export const authConfig = {
  pages: { signIn: "/login" },
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  providers: [],
  callbacks: {
    authorized: ({ auth, request }) => {
      const { pathname } = request.nextUrl;
      const role = (auth?.user as UserLike | undefined)?.role;
      if (pathname === "/login" || pathname === "/admin/login") return true;
      if (pathname.startsWith("/admin")) return role === "admin";
      if (pathname.startsWith("/coach")) return role === "coach";
      if (pathname.startsWith("/partner")) return role === "partner";
      if (pathname.startsWith("/dashboard")) return !!auth;
      // /q/<token> is intentionally public — scanning the member's QR shows
      // a big VALID / INACTIV screen without forcing the scanner to log in.
      return true;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
