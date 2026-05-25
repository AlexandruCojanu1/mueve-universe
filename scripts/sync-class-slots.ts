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
import postgres from "postgres";
import { db } from "../src/db";
import { sections, users, classSlots } from "../src/db/schema";
import { and, eq, inArray } from "drizzle-orm";

const DEFAULT_CAPACITY = 16;
const DEFAULT_DURATION = 60;

// Ensure the unlimited/free columns exist (idempotent). DDL prefers the
// unpooled connection — PgBouncer transaction mode doesn't handle it well.
async function ensureColumns() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL(_UNPOOLED) is not set");
  const sql = postgres(url, { ssl: "require", max: 1 });
  try {
    await sql`ALTER TABLE class_slots ADD COLUMN IF NOT EXISTS unlimited boolean NOT NULL DEFAULT false`;
    await sql`ALTER TABLE class_slots ADD COLUMN IF NOT EXISTS free boolean NOT NULL DEFAULT false`;
    console.log("Columns ensured: unlimited, free");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

type ProgramSlot = {
  day: number; // 0=Mon..6=Sun
  time: string;
  activity?: { ro?: string; en?: string };
};

const isTime = (t: string) => /^\d{1,2}:\d{2}$/.test(t || "");
const isComingSoon = (name: string) => /coming soon|în curând|in curand/i.test(name || "");

async function main() {
  await ensureColumns();

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
  const updated: string[] = [];
  const skipped: string[] = [];

  for (const s of slots) {
    const act = s.activity?.ro?.trim() || "Clasă";
    if (!isTime(s.time) || isComingSoon(act)) {
      skipped.push(`${act} (${s.time || "—"})`);
      continue;
    }
    const dayOfWeek = s.day + 1; // marketing 0=Mon..6=Sun -> class_slots 1=Mon..7=Sun
    const startTime = s.time.padStart(5, "0");

    // Business rules: all sessions are outdoors (no headcount limit); the big
    // social run is always free (no class credit required).
    const unlimited = true;
    const free = /big.*social.*run|marea alergare/i.test(act);

    // Match by day + time (not name) so renaming an activity updates the
    // existing slot instead of creating a duplicate.
    const existing = await db
      .select({ id: classSlots.id })
      .from(classSlots)
      .where(
        and(
          eq(classSlots.coachId, owner.id),
          eq(classSlots.dayOfWeek, dayOfWeek),
          eq(classSlots.startTime, startTime),
        ),
      )
      .limit(1);
    if (existing[0]) {
      await db
        .update(classSlots)
        .set({ classType: act, unlimited, free })
        .where(eq(classSlots.id, existing[0].id));
      updated.push(`${act} dow${dayOfWeek} ${startTime} (unlimited=${unlimited} free=${free})`);
      continue;
    }

    await db.insert(classSlots).values({
      coachId: owner.id,
      dayOfWeek,
      startTime,
      durationMin: DEFAULT_DURATION,
      classType: act,
      capacity: DEFAULT_CAPACITY,
      unlimited,
      free,
      active: true,
    });
    created.push(`dow${dayOfWeek} ${startTime} ${act} (unlimited=${unlimited} free=${free})`);
  }

  console.log(`\nCreated ${created.length}:`);
  created.forEach((c) => console.log("  + " + c));
  console.log(`Updated ${updated.length}:`);
  updated.forEach((c) => console.log("  ~ " + c));
  console.log(`Skipped ${skipped.length}: ${skipped.join(", ")}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
