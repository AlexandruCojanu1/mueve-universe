import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers, cookies } from "next/headers";
import { randomBytes } from "crypto";
import { stravaAuthorizeUrl, stravaEnabled } from "@/lib/strava";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL("/login?from=/dashboard", process.env.NEXTAUTH_URL || "http://localhost:3000"),
    );
  }
  if (!stravaEnabled()) {
    return NextResponse.json(
      { error: "Strava nu e configurat. Setează STRAVA_CLIENT_ID + STRAVA_CLIENT_SECRET." },
      { status: 503 },
    );
  }
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "";
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const origin = process.env.NEXTAUTH_URL || (host ? `${proto}://${host}` : "");
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
