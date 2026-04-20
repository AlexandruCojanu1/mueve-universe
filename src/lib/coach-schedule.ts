import { db } from "@/db";
import { sections } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import type { ProgramData, ProgramSlot } from "@/lib/content-types";

// JS Date.getDay(): 0=Sun..6=Sat. Our schema: 0=Mon..6=Sun.
export function jsDayToSlotDay(d: Date): ProgramSlot["day"] {
  const js = d.getDay();
  return ((js + 6) % 7) as ProgramSlot["day"];
}

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function getProgramData(): Promise<ProgramData | null> {
  const rows = await db
    .select()
    .from(sections)
    .where(eq(sections.type, "program"))
    .orderBy(asc(sections.order))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return row.data as unknown as ProgramData;
}

export async function getSlotsForDate(date: Date): Promise<ProgramSlot[]> {
  const program = await getProgramData();
  if (!program) return [];
  const day = jsDayToSlotDay(date);
  return program.slots
    .filter((s) => s.day === day)
    .sort((a, b) => a.time.localeCompare(b.time));
}
