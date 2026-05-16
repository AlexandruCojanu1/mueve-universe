import { db } from "@/db";
import { attendances, users, classSlots } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

// XP rules — keep simple, derive everything from attendances so we don't need a
// background job or a denormalized counter. Numbers picked to match the
// artifact ranges (You at ~8 runs / 890 XP / lvl 2).
const XP_PER_ATTENDANCE = 80;
const STREAK_BONUS_PER_WEEK = 30;
const CHALLENGE_BONUS = 50;

// Tiers — see artifact: Pavement Newbie → Steady Strider → Road Warrior →
// Mile Crusher → Pack Leader → Legend.
export type Tier = { level: number; name: string; minXp: number };

const TIERS: Tier[] = [
  { level: 1, name: "Pavement Newbie", minXp: 0 },
  { level: 2, name: "Steady Strider", minXp: 400 },
  { level: 3, name: "Road Warrior", minXp: 900 },
  { level: 4, name: "Mile Crusher", minXp: 1600 },
  { level: 5, name: "Pack Leader", minXp: 2400 },
  { level: 6, name: "Legend", minXp: 3500 },
];

export function tierFor(xp: number): Tier {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (xp >= t.minXp) current = t;
  }
  return current;
}

export function nextTierFor(xp: number): Tier | null {
  for (const t of TIERS) {
    if (t.minXp > xp) return t;
  }
  return null;
}

// ISO week number — used for streaks and "this week" challenges.
function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const year = date.getUTCFullYear();
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((+date - +jan1) / 86_400_000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function weekKeyFromAttendance(slotDate: string): string {
  return isoWeekKey(new Date(`${slotDate}T00:00:00Z`));
}

export type UserStats = {
  userId: string;
  runs: number;
  currentStreak: number; // weeks
  longestStreak: number;
  weeksWithAttendance: string[];
  xp: number;
  tier: Tier;
  nextTier: Tier | null;
  progressToNext: number; // 0..1
  challengesCompleted: number;
};

function computeStreak(weekKeys: string[]): { current: number; longest: number } {
  if (weekKeys.length === 0) return { current: 0, longest: 0 };
  const set = new Set(weekKeys);
  // Convert each key to a numeric ordinal (year * 53 + week)
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
  const currentWeek = isoWeekKey(new Date());
  const lastWeek = isoWeekKey(new Date(Date.now() - 7 * 86_400_000));
  // Current streak counts only if the user attended this week or last week.
  if (!set.has(currentWeek) && !set.has(lastWeek)) {
    return { current: 0, longest };
  }
  let current = 0;
  let cursor = set.has(currentWeek) ? currentWeek : lastWeek;
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

// Weekly challenges. Source-of-truth definition — derived results live in
// computeChallenges() so we never store state for unfinished challenges.
export type Challenge = {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number; // 0..1
  done: boolean;
};

export type Activity = {
  id: string;
  at: Date;
  kind: "attendance" | "streak" | "challenge";
  label: string;
  xp: number;
};

export async function getUserStats(userId: string): Promise<UserStats> {
  const rows = await db
    .select({ slotDate: attendances.slotDate })
    .from(attendances)
    .where(eq(attendances.userId, userId));
  const weekKeys = rows.map((r) => weekKeyFromAttendance(r.slotDate));
  const { current, longest } = computeStreak(weekKeys);
  const runs = rows.length;
  // Challenges completed count is computed elsewhere; pass 0 here and let the
  // caller layer in challenge bonuses if needed.
  const xp =
    runs * XP_PER_ATTENDANCE + Math.max(0, current - 1) * STREAK_BONUS_PER_WEEK;
  const tier = tierFor(xp);
  const next = nextTierFor(xp);
  const progressToNext = next
    ? Math.min(1, Math.max(0, (xp - tier.minXp) / (next.minXp - tier.minXp)))
    : 1;
  return {
    userId,
    runs,
    currentStreak: current,
    longestStreak: longest,
    weeksWithAttendance: [...new Set(weekKeys)].sort(),
    xp,
    tier,
    nextTier: next,
    progressToNext,
    challengesCompleted: 0,
  };
}

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  email: string;
  runs: number;
  streak: number;
  xp: number;
  tier: Tier;
  isMe: boolean;
};

export async function getLeaderboard(
  meId: string,
  limit = 10,
): Promise<LeaderboardEntry[]> {
  // One query: per-user attendance count + max slotDate.
  const aggregate = await db
    .select({
      userId: attendances.userId,
      name: users.name,
      email: users.email,
      runs: sql<number>`count(*)::int`,
    })
    .from(attendances)
    .innerJoin(users, eq(users.id, attendances.userId))
    .groupBy(attendances.userId, users.name, users.email);

  // Fill in streak by re-pulling weeks per top candidate. To keep this cheap,
  // sort first by raw runs (proxy for XP), keep top (limit + 1) including me,
  // then compute precise streak/xp for those.
  const sortedByRuns = [...aggregate].sort((a, b) => b.runs - a.runs);
  const topCount = Math.max(limit, 6);
  const candidates = sortedByRuns.slice(0, topCount);
  const meInTop = candidates.some((u) => u.userId === meId);
  if (!meInTop) {
    const mine = aggregate.find((u) => u.userId === meId);
    if (mine) candidates.push(mine);
  }

  const enriched: LeaderboardEntry[] = await Promise.all(
    candidates.map(async (u) => {
      const ws = await db
        .select({ slotDate: attendances.slotDate })
        .from(attendances)
        .where(eq(attendances.userId, u.userId));
      const weeks = ws.map((r) => weekKeyFromAttendance(r.slotDate));
      const { current } = computeStreak(weeks);
      const xp =
        u.runs * XP_PER_ATTENDANCE +
        Math.max(0, current - 1) * STREAK_BONUS_PER_WEEK;
      return {
        rank: 0,
        userId: u.userId,
        name: u.name || (u.userId === meId ? "Tu" : "Membru"),
        email: u.email,
        runs: u.runs,
        streak: current,
        xp,
        tier: tierFor(xp),
        isMe: u.userId === meId,
      };
    }),
  );
  enriched.sort((a, b) => b.xp - a.xp || b.runs - a.runs);
  enriched.forEach((e, i) => {
    e.rank = i + 1;
  });
  return enriched.slice(0, limit + (enriched.some((e) => e.isMe && e.rank <= limit) ? 0 : 1));
}

export async function getChallenges(userId: string): Promise<Challenge[]> {
  const thisWeek = isoWeekKey(new Date());
  // Pull this week's attendances + slot info.
  const rows = await db
    .select({
      slotDate: attendances.slotDate,
      slotId: attendances.slotId,
      classType: classSlots.classType,
    })
    .from(attendances)
    .leftJoin(classSlots, eq(classSlots.id, attendances.slotId))
    .where(eq(attendances.userId, userId));

  const thisWeekRows = rows.filter(
    (r) => weekKeyFromAttendance(r.slotDate) === thisWeek,
  );
  const uniqueWorldsThisWeek = new Set(
    thisWeekRows.map((r) => (r.classType || "").toLowerCase()).filter(Boolean),
  );

  const stats = await getUserStats(userId);

  const challenges: Challenge[] = [
    {
      id: "weekly-2",
      title: "2 sesiuni pe săptămână",
      description: "Bifează cel puțin 2 sesiuni săptămâna asta.",
      reward: CHALLENGE_BONUS,
      progress: Math.min(1, thisWeekRows.length / 2),
      done: thisWeekRows.length >= 2,
    },
    {
      id: "streak-3",
      title: "3 săptămâni la rând",
      description: "Menține un streak de 3 săptămâni.",
      reward: CHALLENGE_BONUS,
      progress: Math.min(1, stats.currentStreak / 3),
      done: stats.currentStreak >= 3,
    },
    {
      id: "variety",
      title: "Două lumi diferite",
      description: "Atinge două activități diferite (yoga, calisthenics, run...) săptămâna asta.",
      reward: CHALLENGE_BONUS,
      progress: Math.min(1, uniqueWorldsThisWeek.size / 2),
      done: uniqueWorldsThisWeek.size >= 2,
    },
  ];
  return challenges;
}

export async function getActivity(userId: string, limit = 8): Promise<Activity[]> {
  const rows = await db
    .select({
      slotId: attendances.slotId,
      slotDate: attendances.slotDate,
      validatedAt: attendances.validatedAt,
      classType: classSlots.classType,
    })
    .from(attendances)
    .leftJoin(classSlots, eq(classSlots.id, attendances.slotId))
    .where(eq(attendances.userId, userId))
    .orderBy(desc(attendances.validatedAt))
    .limit(limit);
  return rows.map((r) => ({
    id: `${r.slotId}-${r.slotDate}`,
    at: r.validatedAt,
    kind: "attendance" as const,
    label: r.classType ? r.classType : "Sesiune",
    xp: XP_PER_ATTENDANCE,
  }));
}

export { XP_PER_ATTENDANCE, STREAK_BONUS_PER_WEEK, CHALLENGE_BONUS };
