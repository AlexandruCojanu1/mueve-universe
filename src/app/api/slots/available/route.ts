import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { classSlots, reservations } from "@/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const today = new Date();
  const days: { date: string; dayOfWeek: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    const js = d.getDay();
    days.push({ date: isoDate(d), dayOfWeek: js === 0 ? 7 : js });
  }

  const slots = await db
    .select()
    .from(classSlots)
    .where(eq(classSlots.active, true))
    .orderBy(asc(classSlots.dayOfWeek), asc(classSlots.startTime));

  const myResvs = await db
    .select()
    .from(reservations)
    .where(eq(reservations.userId, session.user.id));

  const bookedSet = new Set<string>();
  for (const r of myResvs) {
    if (r.status === "active") {
      bookedSet.add(`${r.slotId}|${r.slotDate}`);
    }
  }

  const counts = await db
    .select({
      slotId: reservations.slotId,
      slotDate: reservations.slotDate,
      c: sql<number>`count(*)::int`,
    })
    .from(reservations)
    .where(eq(reservations.status, "active"))
    .groupBy(reservations.slotId, reservations.slotDate);
  const countMap = new Map<string, number>();
  for (const c of counts) {
    countMap.set(`${c.slotId}|${c.slotDate}`, c.c);
  }

  const result = [];
  for (const day of days) {
    for (const s of slots) {
      if (s.dayOfWeek !== day.dayOfWeek) continue;
      const key = `${s.id}|${day.date}`;
      result.push({
        slotId: s.id,
        slotDate: day.date,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        durationMin: s.durationMin,
        classType: s.classType,
        capacity: s.capacity,
        taken: countMap.get(key) ?? 0,
        reserved: bookedSet.has(key),
      });
    }
  }
  return NextResponse.json({ slots: result });
}
