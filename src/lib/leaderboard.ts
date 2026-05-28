import { db } from "@/db";
import { attendances, users, classSlots, xpEvents } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import {
  XP_PER_ATTENDANCE,
  CHALLENGE_BONUS,
  computeStreak,
  weekKeyFromDate,
  currentWeekKey,
  levelForXp,
  xpForLevel,
  tierForXp,
  nextTierFor,
  awardChallenge,
  reconcileMilestones,
  type Tier,
} from "@/lib/xp";

// This module is the read layer over the XP ledger (xp_events). All totals come
// from SUM(awarded_xp); streaks/challenges are derived live for display.

export type { Tier };

export type UserStats = {
  userId: string;
  runs: number;
  currentStreak: number; // weeks
  longestStreak: number;
  weeksWithAttendance: string[];
  xp: number;
  level: number;
  xpIntoLevel: number; // xp earned within the current level
  xpForNextLevel: number; // xp span of the current level (level → level+1)
  tier: Tier;
  nextTier: Tier | null;
  progressToNext: number; // 0..1 toward next tier
  challengesCompleted: number;
};

export async function getUserStats(userId: string): Promise<UserStats> {
  const rows = await db
    .select({ slotDate: attendances.slotDate })
    .from(attendances)
    .where(eq(attendances.userId, userId));
  const weekKeys = rows.map((r) => weekKeyFromDate(r.slotDate));
  const { current, longest } = computeStreak(weekKeys);
  const runs = rows.length;

  const [totalRow] = await db
    .select({ total: sql<number>`coalesce(sum(${xpEvents.awardedXp}), 0)::int` })
    .from(xpEvents)
    .where(eq(xpEvents.userId, userId));
  const xp = totalRow?.total ?? 0;

  const [challengeRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(xpEvents)
    .where(sql`${xpEvents.userId} = ${userId} and ${xpEvents.source} = 'challenge'`);

  const level = levelForXp(xp);
  const levelFloor = xpForLevel(level);
  const levelCeil = xpForLevel(level + 1);
  const tier = tierForXp(xp);
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
    level,
    xpIntoLevel: xp - levelFloor,
    xpForNextLevel: levelCeil - levelFloor,
    tier,
    nextTier: next,
    progressToNext,
    challengesCompleted: challengeRow?.n ?? 0,
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
  level: number;
  tier: Tier;
  isMe: boolean;
};

export async function getLeaderboard(
  meId: string,
  limit = 10,
): Promise<LeaderboardEntry[]> {
  // One aggregate over the ledger: total XP + attendance count per user.
  const runsByUser = db
    .select({
      userId: attendances.userId,
      runs: sql<number>`count(*)::int`.as("runs"),
    })
    .from(attendances)
    .groupBy(attendances.userId)
    .as("runs_by_user");

  const aggregate = await db
    .select({
      userId: xpEvents.userId,
      name: users.name,
      email: users.email,
      xp: sql<number>`coalesce(sum(${xpEvents.awardedXp}), 0)::int`,
      runs: sql<number>`coalesce(${runsByUser.runs}, 0)::int`,
    })
    .from(xpEvents)
    .innerJoin(users, eq(users.id, xpEvents.userId))
    .leftJoin(runsByUser, eq(runsByUser.userId, xpEvents.userId))
    .groupBy(xpEvents.userId, users.name, users.email, runsByUser.runs);

  const sortedByXp = [...aggregate].sort((a, b) => b.xp - a.xp || b.runs - a.runs);
  const topCount = Math.max(limit, 6);
  const candidates = sortedByXp.slice(0, topCount);
  if (!candidates.some((u) => u.userId === meId)) {
    const mine = aggregate.find((u) => u.userId === meId);
    if (mine) candidates.push(mine);
  }

  // Streak is the only per-user value not in the aggregate — pull weeks for the
  // (small) candidate set only.
  const enriched: LeaderboardEntry[] = await Promise.all(
    candidates.map(async (u) => {
      const ws = await db
        .select({ slotDate: attendances.slotDate })
        .from(attendances)
        .where(eq(attendances.userId, u.userId));
      const { current } = computeStreak(ws.map((r) => weekKeyFromDate(r.slotDate)));
      return {
        rank: 0,
        userId: u.userId,
        name: u.name || (u.userId === meId ? "Tu" : "Membru"),
        email: u.email,
        runs: u.runs,
        streak: current,
        xp: u.xp,
        level: levelForXp(u.xp),
        tier: tierForXp(u.xp),
        isMe: u.userId === meId,
      };
    }),
  );
  enriched.sort((a, b) => b.xp - a.xp || b.runs - a.runs);
  enriched.forEach((e, i) => {
    e.rank = i + 1;
  });
  return enriched.slice(
    0,
    limit + (enriched.some((e) => e.isMe && e.rank <= limit) ? 0 : 1),
  );
}

// ── Weekly challenges ──
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

async function computeChallenges(userId: string): Promise<{
  challenges: Challenge[];
  weekKey: string;
}> {
  const weekKey = currentWeekKey();
  const rows = await db
    .select({
      slotDate: attendances.slotDate,
      slotId: attendances.slotId,
      classType: classSlots.classType,
    })
    .from(attendances)
    .leftJoin(classSlots, eq(classSlots.id, attendances.slotId))
    .where(eq(attendances.userId, userId));

  const thisWeekRows = rows.filter((r) => weekKeyFromDate(r.slotDate) === weekKey);
  const uniqueWorldsThisWeek = new Set(
    thisWeekRows.map((r) => (r.classType || "").toLowerCase()).filter(Boolean),
  );

  const weekKeys = rows.map((r) => weekKeyFromDate(r.slotDate));
  const { current } = computeStreak(weekKeys);

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
      reward: 100,
      progress: Math.min(1, current / 3),
      done: current >= 3,
    },
    {
      id: "variety",
      title: "Două lumi diferite",
      description:
        "Atinge două activități diferite (yoga, calisthenics, run...) săptămâna asta.",
      reward: CHALLENGE_BONUS,
      progress: Math.min(1, uniqueWorldsThisWeek.size / 2),
      done: uniqueWorldsThisWeek.size >= 2,
    },
  ];
  return { challenges, weekKey };
}

export async function getChallenges(userId: string): Promise<Challenge[]> {
  const { challenges } = await computeChallenges(userId);
  return challenges;
}

// Awards XP for any challenge/milestone the user has completed but not yet been
// granted. Idempotent — call on the user's own dashboard load + after a check-in
// or Strava sync. Never call this for *other* users (it writes).
export async function reconcileUserXp(userId: string): Promise<number> {
  let total = 0;
  try {
    const { challenges, weekKey } = await computeChallenges(userId);
    for (const c of challenges) {
      if (c.done) total += await awardChallenge(userId, c.id, c.reward, weekKey);
    }
    total += await reconcileMilestones(userId);
  } catch {
    // best-effort; never block a page render on XP reconciliation
  }
  return total;
}

export async function getActivity(userId: string, limit = 8): Promise<Activity[]> {
  const events = await db
    .select({
      id: xpEvents.id,
      source: xpEvents.source,
      refId: xpEvents.refId,
      awardedXp: xpEvents.awardedXp,
      occurredAt: xpEvents.occurredAt,
      metadata: xpEvents.metadata,
    })
    .from(xpEvents)
    .where(eq(xpEvents.userId, userId))
    .orderBy(desc(xpEvents.occurredAt))
    .limit(limit);

  const labelFor = (
    source: string,
    metadata: Record<string, unknown> | null,
  ): { kind: Activity["kind"]; label: string } => {
    switch (source) {
      case "attendance":
        return { kind: "attendance", label: "Sesiune în club" };
      case "strava": {
        const sport = (metadata?.sportType as string)?.toLowerCase() || "activitate";
        const km = metadata?.km ? `${metadata.km}km` : "";
        return { kind: "attendance", label: `Strava · ${sport} ${km}`.trim() };
      }
      case "challenge":
        return { kind: "challenge", label: "Challenge completat" };
      case "milestone":
        return { kind: "streak", label: "Milestone 🏅" };
      default:
        return { kind: "attendance", label: "XP" };
    }
  };

  return events.map((e) => {
    const { kind, label } = labelFor(e.source, e.metadata);
    return { id: e.id, at: e.occurredAt, kind, label, xp: e.awardedXp };
  });
}

export { XP_PER_ATTENDANCE, CHALLENGE_BONUS };
