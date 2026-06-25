import { db } from "@/db";
import { sections, users, classSlots } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import type { ProgramSlot } from "@/lib/content-types";

const DEFAULT_CAPACITY = 16;
const DEFAULT_DURATION = 60;

const isTime = (t: string) => /^\d{1,2}:\d{2}$/.test(t || "");
const isComingSoon = (name: string) =>
  /coming soon|în curând|in curand/i.test(name || "");
const norm = (s: string) =>
  (s || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

type DesiredSlot = {
  dayOfWeek: number; // 1=Mon..7=Sun
  startTime: string; // HH:MM
  classType: string;
  unlimited: boolean;
  free: boolean;
};

export type SyncReport = {
  owner: string | null;
  created: string[];
  updated: string[];
  deactivated: string[];
  unchanged: string[];
  skipped: string[];
  dryRun: boolean;
};

/**
 * Reconcile the bookable `class_slots` table with the marketing weekly
 * programme (sections "program" content) so the dashboard reservation board
 * and the public site calendar always show the same sessions.
 *
 * - Teaser / "coming soon" / no-time entries are never made bookable.
 * - Matches an existing slot by (day, class name) first, then (day, time), so
 *   renaming OR re-timing an activity updates the existing slot instead of
 *   creating a duplicate.
 * - Slots that no longer exist in the programme are DEACTIVATED (active=false),
 *   never deleted, so historical reservations stay intact.
 */
export async function syncClassSlotsFromProgram(
  opts: { dryRun?: boolean } = {},
): Promise<SyncReport> {
  const dryRun = !!opts.dryRun;
  const report: SyncReport = {
    owner: null,
    created: [],
    updated: [],
    deactivated: [],
    unchanged: [],
    skipped: [],
    dryRun,
  };

  // Owner: prefer the grappes admin, else any coach, else any admin.
  const staff = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(inArray(users.role, ["admin", "coach"]));
  if (staff.length === 0) throw new Error("No admin/coach user to own the slots.");
  const owner =
    staff.find((u) => u.email === "grappes.ai@gmail.com") ??
    staff.find((u) => u.role === "coach") ??
    staff[0];
  report.owner = owner.email;

  // Source of truth: the public programme.
  const progRow = (
    await db
      .select({ data: sections.data })
      .from(sections)
      .where(eq(sections.type, "program"))
      .limit(1)
  )[0];
  const slots = ((progRow?.data as { slots?: ProgramSlot[] } | undefined)?.slots ??
    []) as ProgramSlot[];

  // Build the desired bookable set.
  const desired: DesiredSlot[] = [];
  for (const s of slots) {
    const act = s.activity?.ro?.trim() || s.activity?.en?.trim() || "Clasă";
    if (s.teaser || !isTime(s.time) || isComingSoon(act)) {
      report.skipped.push(`${act} (${s.time || "—"})`);
      continue;
    }
    desired.push({
      dayOfWeek: s.day + 1, // marketing 0=Mon..6=Sun -> class_slots 1=Mon..7=Sun
      startTime: s.time.padStart(5, "0"),
      classType: act,
      unlimited: true, // all sessions are outdoor (no headcount limit)
      free: /big.*social.*run|marea alergare/i.test(act),
    });
  }

  // Current slots for this owner.
  const existing = await db
    .select()
    .from(classSlots)
    .where(eq(classSlots.coachId, owner.id));
  const usedIds = new Set<string>();

  for (const d of desired) {
    const match =
      existing.find(
        (e) =>
          !usedIds.has(e.id) &&
          e.dayOfWeek === d.dayOfWeek &&
          norm(e.classType) === norm(d.classType),
      ) ??
      existing.find(
        (e) =>
          !usedIds.has(e.id) &&
          e.dayOfWeek === d.dayOfWeek &&
          e.startTime === d.startTime,
      );

    const tag = `${d.classType} dow${d.dayOfWeek} ${d.startTime}`;

    if (match) {
      usedIds.add(match.id);
      const changed =
        match.classType !== d.classType ||
        match.startTime !== d.startTime ||
        match.unlimited !== d.unlimited ||
        match.free !== d.free ||
        !match.active;
      if (!changed) {
        report.unchanged.push(tag);
        continue;
      }
      if (!dryRun) {
        await db
          .update(classSlots)
          .set({
            classType: d.classType,
            startTime: d.startTime,
            unlimited: d.unlimited,
            free: d.free,
            active: true,
            updatedAt: new Date(),
          })
          .where(eq(classSlots.id, match.id));
      }
      report.updated.push(
        `${tag} (was "${match.classType}" ${match.startTime} active=${match.active})`,
      );
    } else {
      if (!dryRun) {
        await db.insert(classSlots).values({
          coachId: owner.id,
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime,
          durationMin: DEFAULT_DURATION,
          classType: d.classType,
          capacity: DEFAULT_CAPACITY,
          unlimited: d.unlimited,
          free: d.free,
          active: true,
        });
      }
      report.created.push(`${tag} (free=${d.free})`);
    }
  }

  // Deactivate any active slot the programme no longer has.
  for (const e of existing) {
    if (usedIds.has(e.id) || !e.active) continue;
    if (!dryRun) {
      await db
        .update(classSlots)
        .set({ active: false, updatedAt: new Date() })
        .where(eq(classSlots.id, e.id));
    }
    report.deactivated.push(`${e.classType} dow${e.dayOfWeek} ${e.startTime}`);
  }

  return report;
}
