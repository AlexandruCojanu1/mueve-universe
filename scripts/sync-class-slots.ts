/**
 * Sync the marketing weekly programme (sections "program" content) into the
 * bookable class_slots table so the reservation flow has real sessions to
 * offer. Idempotent: matches on (dayOfWeek, startTime, classType) and only
 * inserts what's missing. "Coming soon" / TBA entries are skipped.
 *
 *   tsx --env-file=.env.local scripts/sync-class-slots.ts
 *
 * Capacity/duration use sensible defaults (16 / 60 min) — adjust per slot in
 * /admin/slots afterwards.
 */
import { db } from "../src/db";
import { sections, users, classSlots } from "../src/db/schema";
import { and, eq, inArray } from "drizzle-orm";

const DEFAULT_CAPACITY = 16;
const DEFAULT_DURATION = 60;

type ProgramSlot = {
  day: number; // 0=Mon..6=Sun
  time: string;
  activity?: { ro?: string; en?: string };
};

const isTime = (t: string) => /^\d{1,2}:\d{2}$/.test(t || "");
const isComingSoon = (name: string) => /coming soon|în curând|in curand/i.test(name || "");

async function main() {
  // Owner: prefer the grappes admin, else any admin/coach.
  const staff = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(inArray(users.role, ["admin", "coach"]));
  if (staff.length === 0) throw new Error("No admin/coach user to own the slots.");
  const owner =
    staff.find((u) => u.email === "grappes.ai@gmail.com") ??
    staff.find((u) => u.role === "coach") ??
    staff[0];
  console.log(`Owner: ${owner.email} (${owner.role})`);

  const progRow = (
    await db.select({ data: sections.data }).from(sections).where(eq(sections.type, "program")).limit(1)
  )[0];
  const slots = ((progRow?.data as { slots?: ProgramSlot[] } | undefined)?.slots ?? []) as ProgramSlot[];

  const created: string[] = [];
  const skipped: string[] = [];

  for (const s of slots) {
    const act = s.activity?.ro?.trim() || "Clasă";
    if (!isTime(s.time) || isComingSoon(act)) {
      skipped.push(`${act} (${s.time || "—"})`);
      continue;
    }
    const dayOfWeek = s.day + 1; // marketing 0=Mon..6=Sun -> class_slots 1=Mon..7=Sun
    const startTime = s.time.padStart(5, "0");

    const existing = await db
      .select({ id: classSlots.id })
      .from(classSlots)
      .where(
        and(
          eq(classSlots.coachId, owner.id),
          eq(classSlots.dayOfWeek, dayOfWeek),
          eq(classSlots.startTime, startTime),
          eq(classSlots.classType, act),
        ),
      )
      .limit(1);
    if (existing[0]) {
      skipped.push(`${act} dow${dayOfWeek} ${startTime} (exists)`);
      continue;
    }

    await db.insert(classSlots).values({
      coachId: owner.id,
      dayOfWeek,
      startTime,
      durationMin: DEFAULT_DURATION,
      classType: act,
      capacity: DEFAULT_CAPACITY,
      active: true,
    });
    created.push(`dow${dayOfWeek} ${startTime} ${act}`);
  }

  console.log(`\nCreated ${created.length}:`);
  created.forEach((c) => console.log("  + " + c));
  console.log(`Skipped ${skipped.length}: ${skipped.join(", ")}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
