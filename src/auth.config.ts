import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/db/schema";

type UserLike = { role?: UserRole; id?: string };

const isProd = process.env.NODE_ENV === "production";

export const authConfig = {
  pages: { signIn: "/login" },
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  // Share the session cookie across the whole domain (apex + www). Without an
  // explicit domain the cookie is host-only, so logging in on one host (e.g. an
  // OAuth callback or apex) left the session invisible on www → forced re-login
  // every time. The `__Secure-` prefix is fine alongside a Domain attribute
  // (unlike `__Host-`, which we don't touch). Prod-only so localhost dev keeps
  // working with the default host-only cookies.
  cookies: isProd
    ? {
        sessionToken: {
          name: "__Secure-authjs.session-token",
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: true,
            domain: ".mueve.ro",
          },
        },
      }
    : undefined,
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
