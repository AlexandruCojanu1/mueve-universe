import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers, cookies } from "next/headers";
import { randomBytes } from "crypto";
import { stravaAuthorizeUrl, stravaEnabled } from "@/lib/strava";

export async function GET() {
  const session = await auth();
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "";
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const origin = process.env.NEXTAUTH_URL || (host ? `${proto}://${host}` : "http://localhost:3000");

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login?from=/dashboard/profile", origin));
  }
  // Strava integration is "coming soon" — block new connections for now.
  const COMING_SOON = true;
  if (COMING_SOON) {
    return NextResponse.redirect(new URL("/dashboard/profile?strava=soon#strava", origin));
  }
  if (!stravaEnabled()) {
    // Surface a friendly message in the card instead of dumping raw JSON.
    return NextResponse.redirect(new URL("/dashboard/profile?strava=disabled#strava", origin));
  }
  const state = randomBytes(16).toString("hex");
  const jar = await cookies();
  jar.set("strava_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return NextResponse.redirect(stravaAuthorizeUrl(origin, state));
}
