import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/db/schema";

type UserLike = { role?: UserRole; id?: string };

export const authConfig = {
  pages: { signIn: "/login" },
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized: ({ auth, request }) => {
      const { pathname } = request.nextUrl;
      const role = (auth?.user as UserLike | undefined)?.role;
      if (pathname === "/login" || pathname === "/admin/login") return true;
      if (pathname.startsWith("/admin")) return role === "admin";
      if (pathname.startsWith("/coach")) return role === "admin" || role === "coach";
      if (pathname.startsWith("/partner"))
        return role === "admin" || role === "partner";
      if (pathname.startsWith("/dashboard")) return !!auth;
      if (pathname.startsWith("/q/")) return !!auth;
      return true;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
