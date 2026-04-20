import { db } from "@/db";
import { attendances } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import type { ProgramData, ProgramSlot } from "@/lib/content-types";
import { isoDate, jsDayToSlotDay } from "@/lib/coach-schedule";

export type UserStats = {
  total: number;
  thisMonth: number;
  streakDays: number;
  favoriteSlot: { slotId: string; count: number } | null;
  worldBreakdown: { world: string; count: number }[];
};

export type UpcomingSession = {
  date: string;
  dayLabel: string;
  slot: ProgramSlot;
};

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function computeUserStats(userId: string): Promise<UserStats> {
  const [totalRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(attendances)
    .where(eq(attendances.userId, userId));

  const [thisMonthRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(attendances)
    .where(
      and(
        eq(attendances.userId, userId),
        gte(attendances.slotDate, isoDate(startOfMonth())),
      ),
    );

  const bySlot = await db
    .select({
      slotId: attendances.slotId,
      n: sql<number>`count(*)::int`,
    })
    .from(attendances)
    .where(eq(attendances.userId, userId))
    .groupBy(attendances.slotId);

  const fav = bySlot
    .slice()
    .sort((a, b) => b.n - a.n)[0];

  const distinctDates = await db
    .select({ d: attendances.slotDate })
    .from(attendances)
    .where(eq(attendances.userId, userId))
    .groupBy(attendances.slotDate);

  const dateSet = new Set(distinctDates.map((r) => r.d));
  let streak = 0;
  const cursor = new Date();
  while (streak < 365) {
    if (dateSet.has(isoDate(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    total: totalRow?.n ?? 0,
    thisMonth: thisMonthRow?.n ?? 0,
    streakDays: streak,
    favoriteSlot: fav ? { slotId: fav.slotId, count: fav.n } : null,
    worldBreakdown: [],
  };
}

export async function computeWorldBreakdown(
  userId: string,
  program: ProgramData | null,
): Promise<{ world: string; count: number }[]> {
  if (!program) return [];
  const rows = await db
    .select({ slotId: attendances.slotId, n: sql<number>`count(*)::int` })
    .from(attendances)
    .where(eq(attendances.userId, userId))
    .groupBy(attendances.slotId);
  const worldMap = new Map<string, number>();
  for (const r of rows) {
    const slot = program.slots.find((s) => s.id === r.slotId);
    const world = slot?.world.ro ?? "Altele";
    worldMap.set(world, (worldMap.get(world) ?? 0) + r.n);
  }
  return Array.from(worldMap.entries())
    .map(([world, count]) => ({ world, count }))
    .sort((a, b) => b.count - a.count);
}

export function upcomingSessions(
  program: ProgramData | null,
  days = 7,
  from = new Date(),
): UpcomingSession[] {
  if (!program) return [];
  const out: UpcomingSession[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const dayIdx = jsDayToSlotDay(d);
    const slots = program.slots
      .filter((s) => s.day === dayIdx)
      .sort((a, b) => a.time.localeCompare(b.time));
    const dayLabel = program.dayLabels[dayIdx]?.ro ?? "";
    for (const slot of slots) {
      out.push({ date: isoDate(d), dayLabel, slot });
    }
  }
  return out;
}
