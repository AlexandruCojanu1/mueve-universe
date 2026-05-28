import { db } from "@/db";
import { xpEvents, attendances, type XpSource } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────
// Mueve XP engine — ledger-based. Total XP = SUM(xp_events.awarded_xp).
// Every award is idempotent (unique idempotency_key) so XP is monotonic and
// can never be double-counted. See Desktop/Mueve-XP-Strategy.html for the
// product rationale behind the numbers.
// ─────────────────────────────────────────────────────────────────────────

// ── Base values ──
export const XP_PER_ATTENDANCE = 100;
export const CHALLENGE_BONUS = 75; // default; some challenges override (below)

// Strava: trust-weighted, with daily + weekly caps so the phone can't
// out-earn someone who actually shows up. See src/lib/strava.ts for enforcement.
export const STRAVA_XP_PER_KM_CARDIO = 8; // run / walk / hike
export const STRAVA_XP_PER_KM_RIDE = 3; // bike
export const STRAVA_MIN_KM = 1;
export const STRAVA_DAILY_CAP_XP = 100;
export const STRAVA_WEEKLY_CAP_XP = 300;

// ── Streak multiplier (basis points; 100 = ×1.0). Applied to all XP earned
// during an active streak week, then banked into the event so it stays monotonic.
export function streakMultiplierBp(weeks: number): number {
  if (weeks >= 13) return 150;
  if (weeks >= 9) return 140;
  if (weeks >= 5) return 125;
  if (weeks >= 3) return 110;
  return 100;
}

// ── Levels ──  XP needed to *reach* level L:  XP(L) = 50 · L · (L−1)
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 50 * level * (level - 1);
}

export function levelForXp(xp: number): number {
  // Invert XP(L)=50L(L-1): L = floor((1 + sqrt(1 + xp/12.5)) / 2)
  if (xp <= 0) return 1;
  const level = Math.floor((1 + Math.sqrt(1 + xp / 12.5)) / 2);
  return Math.max(1, level);
}

// ── Tiers (named bands over levels) ──
export type Tier = { level: number; name: string; minXp: number; band: [number, number] };

// minXp = xpForLevel(band start) — kept on the object for the existing UI which
// shows "XP until next tier".
export const TIERS: Tier[] = [
  { level: 1, name: "Pavement Newbie", minXp: xpForLevel(1), band: [1, 4] },
  { level: 2, name: "Steady Strider", minXp: xpForLevel(5), band: [5, 9] },
  { level: 3, name: "Road Warrior", minXp: xpForLevel(10), band: [10, 14] },
  { level: 4, name: "Mile Crusher", minXp: xpForLevel(15), band: [15, 19] },
  { level: 5, name: "Pack Leader", minXp: xpForLevel(20), band: [20, 29] },
  { level: 6, name: "Legend", minXp: xpForLevel(30), band: [30, Infinity] },
];

export function tierForLevel(level: number): Tier {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (level >= t.band[0]) current = t;
  }
  return current;
}

export function tierForXp(xp: number): Tier {
  return tierForLevel(levelForXp(xp));
}

export function nextTierFor(xp: number): Tier | null {
  for (const t of TIERS) {
    if (t.minXp > xp) return t;
  }
  return null;
}

// ── ISO week keys (Europe/Bucharest) ──
function bucharestYmd(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const year = date.getUTCFullYear();
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((+date - +jan1) / 86_400_000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

// Date-only string ("YYYY-MM-DD") → ISO week. TZ-agnostic (already a calendar date).
export function weekKeyFromDate(dateStr: string): string {
  return isoWeekKey(new Date(`${dateStr}T00:00:00Z`));
}

export function currentWeekKey(): string {
  return isoWeekKey(new Date(`${bucharestYmd()}T00:00:00Z`));
}

function weekKeyOffset(daysAgo: number): string {
  const ymd = bucharestYmd(new Date(Date.now() - daysAgo * 86_400_000));
  return isoWeekKey(new Date(`${ymd}T00:00:00Z`));
}

export function computeStreak(weekKeys: string[]): { current: number; longest: number } {
  if (weekKeys.length === 0) return { current: 0, longest: 0 };
  const set = new Set(weekKeys);
  const ord = (k: string) => {
    const [y, w] = k.split("-W");
    return parseInt(y, 10) * 53 + parseInt(w, 10);
  };
  const sorted = [...set].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (ord(sorted[i]) === ord(sorted[i - 1]) + 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }
  const thisWeek = currentWeekKey();
  const lastWeek = weekKeyOffset(7);
  // Current streak counts only if the user was active this week or last week.
  if (!set.has(thisWeek) && !set.has(lastWeek)) return { current: 0, longest };
  let current = 0;
  let cursor = set.has(thisWeek) ? thisWeek : lastWeek;
  while (set.has(cursor)) {
    current++;
    const [y, w] = cursor.split("-W");
    let wNum = parseInt(w, 10) - 1;
    let yNum = parseInt(y, 10);
    if (wNum < 1) {
      yNum--;
      wNum = 52;
    }
    cursor = `${yNum}-W${String(wNum).padStart(2, "0")}`;
  }
  return { current, longest: Math.max(longest, current) };
}

// ── Core award primitive ──
// Inserts one ledger event. Returns the XP actually awarded (0 if the
// idempotency key already existed — i.e. this award already happened).
export async function awardXp(opts: {
  userId: string;
  source: XpSource;
  idempotencyKey: string;
  baseXp: number;
  multiplierBp?: number;
  refId?: string | null;
  occurredAt?: Date;
  metadata?: Record<string, unknown>;
}): Promise<number> {
  const multiplierBp = opts.multiplierBp ?? 100;
  const awardedXp = Math.max(0, Math.round((opts.baseXp * multiplierBp) / 100));
  if (awardedXp === 0 && opts.baseXp === 0) return 0;
  const inserted = await db
    .insert(xpEvents)
    .values({
      userId: opts.userId,
      source: opts.source,
      refId: opts.refId ?? null,
      baseXp: opts.baseXp,
      multiplierBp,
      awardedXp,
      idempotencyKey: opts.idempotencyKey,
      occurredAt: opts.occurredAt ?? new Date(),
      metadata: opts.metadata,
    })
    .onConflictDoNothing({ target: xpEvents.idempotencyKey })
    .returning({ awardedXp: xpEvents.awardedXp });
  return inserted[0]?.awardedXp ?? 0;
}

export async function getUserXpTotal(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${xpEvents.awardedXp}), 0)::int` })
    .from(xpEvents)
    .where(eq(xpEvents.userId, userId));
  return row?.total ?? 0;
}

// ── Streak helper (reads attendance weeks for a user) ──
async function userWeekKeys(userId: string): Promise<string[]> {
  const rows = await db
    .select({ slotDate: attendances.slotDate })
    .from(attendances)
    .where(eq(attendances.userId, userId));
  return rows.map((r) => weekKeyFromDate(r.slotDate));
}

// ── Award: in-club attendance ──
// Call AFTER the attendance row is inserted, so the streak (which drives the
// multiplier) includes this session.
export async function awardAttendance(
  userId: string,
  slotId: string,
  slotDate: string,
): Promise<number> {
  const { current } = computeStreak(await userWeekKeys(userId));
  const multiplierBp = streakMultiplierBp(current);
  const awarded = await awardXp({
    userId,
    source: "attendance",
    idempotencyKey: `attendance:${userId}:${slotId}:${slotDate}`,
    baseXp: XP_PER_ATTENDANCE,
    multiplierBp,
    refId: slotId,
    occurredAt: new Date(`${slotDate}T12:00:00Z`),
    metadata: { slotDate, streakWeeks: current },
  });
  // Reconcile session + streak milestones opportunistically.
  await reconcileMilestones(userId).catch(() => {});
  return awarded;
}

// ── Award: a single Strava activity (XP already capped by caller) ──
export async function awardStravaActivity(opts: {
  userId: string;
  activityId: string;
  xp: number;
  occurredAt: Date;
  metadata?: Record<string, unknown>;
}): Promise<number> {
  const { current } = computeStreak(await userWeekKeys(opts.userId));
  const multiplierBp = streakMultiplierBp(current);
  return awardXp({
    userId: opts.userId,
    source: "strava",
    idempotencyKey: `strava:${opts.activityId}`,
    baseXp: opts.xp,
    multiplierBp,
    refId: opts.activityId,
    occurredAt: opts.occurredAt,
    metadata: opts.metadata,
  });
}

// ── Milestones (one-time, permanent) ──
const SESSION_MILESTONES: { n: number; xp: number }[] = [
  { n: 1, xp: 50 },
  { n: 10, xp: 200 },
  { n: 25, xp: 400 },
  { n: 50, xp: 750 },
  { n: 100, xp: 1500 },
];
const STREAK_MILESTONES: { weeks: number; xp: number }[] = [
  { weeks: 4, xp: 150 },
  { weeks: 12, xp: 500 },
  { weeks: 26, xp: 1200 },
];

// Awards any session/streak milestones the user has crossed but not yet been
// granted. Idempotent — safe to call on every check-in / dashboard load.
export async function reconcileMilestones(userId: string): Promise<number> {
  const weeks = await userWeekKeys(userId);
  const runs = weeks.length;
  const { longest } = computeStreak(weeks);
  let total = 0;
  for (const m of SESSION_MILESTONES) {
    if (runs >= m.n) {
      total += await awardXp({
        userId,
        source: "milestone",
        idempotencyKey: `milestone:sessions-${m.n}:${userId}`,
        baseXp: m.xp,
        metadata: { kind: "sessions", threshold: m.n },
      });
    }
  }
  for (const m of STREAK_MILESTONES) {
    if (longest >= m.weeks) {
      total += await awardXp({
        userId,
        source: "milestone",
        idempotencyKey: `milestone:streak-${m.weeks}:${userId}`,
        baseXp: m.xp,
        metadata: { kind: "streak", threshold: m.weeks },
      });
    }
  }
  return total;
}

export async function awardStravaFirstSync(userId: string): Promise<number> {
  return awardXp({
    userId,
    source: "milestone",
    idempotencyKey: `milestone:strava-first:${userId}`,
    baseXp: 50,
    metadata: { kind: "strava-first" },
  });
}

// ── Challenge award (called when a weekly challenge flips to done) ──
export async function awardChallenge(
  userId: string,
  challengeId: string,
  reward: number,
  weekKey: string = currentWeekKey(),
): Promise<number> {
  return awardXp({
    userId,
    source: "challenge",
    idempotencyKey: `challenge:${weekKey}:${challengeId}:${userId}`,
    baseXp: reward,
    refId: challengeId,
    metadata: { weekKey, challengeId },
  });
}
