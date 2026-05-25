import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { exchangeCode, syncRecentActivities } from "@/lib/strava";

export async function GET(req: Request) {
  const session = await auth();
  const url = new URL(req.url);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login?from=/dashboard", url));
  }
  const userId = session.user.id;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");

  const jar = await cookies();
  const expectedState = jar.get("strava_oauth_state")?.value;
  jar.delete("strava_oauth_state");

  if (err || !code) {
    return NextResponse.redirect(
      new URL("/dashboard/profile?strava=cancelled#strava", url),
    );
  }
  if (!state || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/dashboard/profile?strava=state#strava", url),
    );
  }

  let tokens;
  try {
    tokens = await exchangeCode(code);
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard/profile?strava=oauth_failed#strava", url),
    );
  }
  if (!tokens.athlete?.id) {
    return NextResponse.redirect(
      new URL("/dashboard/profile?strava=no_athlete#strava", url),
    );
  }

  const athleteName = [tokens.athlete.firstname, tokens.athlete.lastname]
    .filter(Boolean)
    .join(" ")
    .trim();

  await db
    .update(users)
    .set({
      stravaAthleteId: String(tokens.athlete.id),
      stravaAthleteName: athleteName || null,
      stravaAccessToken: tokens.access_token,
      stravaRefreshToken: tokens.refresh_token,
      stravaTokenExpiresAt: new Date(tokens.expires_at * 1000),
    })
    .where(eq(users.id, userId));

  // Fire-and-forget initial sync; ignore errors so the user always lands on
  // dashboard even if their first import fails.
  try {
    await syncRecentActivities(userId);
  } catch {}

  return NextResponse.redirect(new URL("/dashboard/profile?strava=connected#strava", url));
}
