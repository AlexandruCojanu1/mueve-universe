import { db } from "@/db";
import { users, stravaActivities } from "@/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import {
  STRAVA_XP_PER_KM_CARDIO,
  STRAVA_XP_PER_KM_RIDE,
  STRAVA_MIN_KM,
  STRAVA_DAILY_CAP_XP,
  STRAVA_WEEKLY_CAP_XP,
  isoWeekKey,
  awardStravaActivity,
  awardStravaFirstSync,
} from "@/lib/xp";

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID || "";
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET || "";

export function stravaEnabled(): boolean {
  return !!STRAVA_CLIENT_ID && !!STRAVA_CLIENT_SECRET;
}

export function stravaAuthorizeUrl(origin: string, state: string): string {
  const redirect = `${origin}/api/strava/callback`;
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: redirect,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read",
    state,
  });
  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix seconds
  athlete?: { id: number; firstname?: string; lastname?: string };
};

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const res = await fetch("https://www.strava.com/api/v3/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strava OAuth exchange failed (${res.status}): ${text}`);
  }
  return (await res.json()) as TokenResponse;
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch("https://www.strava.com/api/v3/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strava refresh failed (${res.status}): ${text}`);
  }
  return (await res.json()) as TokenResponse;
}

async function getValidAccessToken(userId: string): Promise<string | null> {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u?.stravaAccessToken || !u?.stravaRefreshToken) return null;
  const expiresAt = u.stravaTokenExpiresAt
    ? u.stravaTokenExpiresAt.getTime()
    : 0;
  // Refresh if token expires in the next 5 min.
  if (expiresAt > Date.now() + 5 * 60_000) {
    return u.stravaAccessToken;
  }
  const fresh = await refreshAccessToken(u.stravaRefreshToken);
  await db
    .update(users)
    .set({
      stravaAccessToken: fresh.access_token,
      stravaRefreshToken: fresh.refresh_token,
      stravaTokenExpiresAt: new Date(fresh.expires_at * 1000),
    })
    .where(eq(users.id, userId));
  return fresh.access_token;
}

type StravaActivity = {
  id: number;
  name: string;
  sport_type: string;
  type: string;
  distance: number; // meters
  moving_time: number; // seconds
  start_date: string;
};

// XP rules live in src/lib/xp.ts (single source of truth). Trust-weighted by
// activity type, with daily + weekly caps so re-syncing or a phone can't
// out-earn someone who actually shows up in the club. The cap is enforced on
// the BASE km-XP; the streak multiplier is then applied at award time.
function baseXpForActivity(a: StravaActivity): number {
  const kind = (a.sport_type || a.type || "").toLowerCase();
  const km = a.distance / 1000;
  if (km < STRAVA_MIN_KM) return 0;
  const isCardio =
    kind.includes("run") ||
    kind.includes("walk") ||
    kind.includes("hike") ||
    kind.includes("treadmill");
  const isRide = kind === "ride" || kind.includes("ride") || kind.includes("bike");
  if (isCardio) return Math.round(km * STRAVA_XP_PER_KM_CARDIO);
  if (isRide) return Math.round(km * STRAVA_XP_PER_KM_RIDE);
  return 0;
}

export async function syncRecentActivities(userId: string): Promise<{
  imported: number;
  xpAwarded: number;
  skipped: number;
}> {
  const token = await getValidAccessToken(userId);
  if (!token) return { imported: 0, xpAwarded: 0, skipped: 0 };

  // Pull the last 30 activities — Strava's default per_page is 30.
  const params = new URLSearchParams({ per_page: "30", page: "1" });
  const res = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?${params}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    throw new Error(`Strava list activities failed (${res.status})`);
  }
  const activities = (await res.json()) as StravaActivity[];

  let imported = 0;
  let xpAwarded = 0;
  let skipped = 0;

  // Track per-day and per-week base XP to enforce caps. Re-fetch what's already
  // in DB so the caps survive across syncs.
  const dayBucket = new Map<string, number>();
  const weekBucket = new Map<string, number>();

  const startedOldest = activities
    .map((a) => new Date(a.start_date))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  if (startedOldest) {
    // Back up a full week so weekly capping sees the whole ISO week.
    const horizon = new Date(startedOldest);
    horizon.setUTCHours(0, 0, 0, 0);
    horizon.setUTCDate(horizon.getUTCDate() - 7);
    const prior = await db
      .select({
        startedAt: stravaActivities.startedAt,
        xp: stravaActivities.xpAwarded,
      })
      .from(stravaActivities)
      .where(
        and(
          eq(stravaActivities.userId, userId),
          gte(stravaActivities.startedAt, horizon),
        ),
      );
    for (const p of prior) {
      const day = p.startedAt.toISOString().slice(0, 10);
      const week = isoWeekKey(p.startedAt);
      dayBucket.set(day, (dayBucket.get(day) || 0) + p.xp);
      weekBucket.set(week, (weekBucket.get(week) || 0) + p.xp);
    }
  }

  // Award the first-sync milestone once (idempotent).
  await awardStravaFirstSync(userId).catch(() => {});

  // Process oldest → newest so caps fill in chronological order.
  const ordered = [...activities].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
  );

  for (const a of ordered) {
    const id = String(a.id);
    const existing = await db
      .select({ id: stravaActivities.id })
      .from(stravaActivities)
      .where(eq(stravaActivities.id, id))
      .limit(1);
    if (existing.length > 0) {
      skipped++;
      continue;
    }
    const rawXp = baseXpForActivity(a);
    const startedAt = new Date(a.start_date);
    const day = startedAt.toISOString().slice(0, 10);
    const week = isoWeekKey(startedAt);
    const dayRoom = STRAVA_DAILY_CAP_XP - (dayBucket.get(day) || 0);
    const weekRoom = STRAVA_WEEKLY_CAP_XP - (weekBucket.get(week) || 0);
    const cappedBase = Math.max(0, Math.min(rawXp, dayRoom, weekRoom));
    dayBucket.set(day, (dayBucket.get(day) || 0) + cappedBase);
    weekBucket.set(week, (weekBucket.get(week) || 0) + cappedBase);

    await db.insert(stravaActivities).values({
      id,
      userId,
      name: a.name || "",
      sportType: a.sport_type || a.type || "",
      distanceMeters: Math.round(a.distance),
      movingTimeSec: a.moving_time,
      startedAt,
      xpAwarded: cappedBase, // base (pre-multiplier) for history + cap accounting
    });
    // Bank the streak-multiplied award in the ledger (idempotent on activity id).
    const awarded = await awardStravaActivity({
      userId,
      activityId: id,
      xp: cappedBase,
      occurredAt: startedAt,
      metadata: {
        sportType: a.sport_type || a.type || "",
        km: +(a.distance / 1000).toFixed(1),
      },
    });
    imported++;
    xpAwarded += awarded;
  }

  await db
    .update(users)
    .set({ stravaLastSyncAt: new Date() })
    .where(eq(users.id, userId));

  return { imported, xpAwarded, skipped };
}

export async function listRecentStravaForUser(userId: string, limit = 5) {
  return db
    .select()
    .from(stravaActivities)
    .where(eq(stravaActivities.userId, userId))
    .orderBy(desc(stravaActivities.startedAt))
    .limit(limit);
}

export async function disconnectStrava(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      stravaAthleteId: null,
      stravaAthleteName: null,
      stravaAccessToken: null,
      stravaRefreshToken: null,
      stravaTokenExpiresAt: null,
    })
    .where(eq(users.id, userId));
  // Keep the imported activity rows + XP — disconnecting shouldn't wipe history.
}
