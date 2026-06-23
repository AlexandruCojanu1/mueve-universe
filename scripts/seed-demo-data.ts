/**
 * Demo seed for users — populates credits and attendances so dashboards aren't
 * empty for the launch demo. Safe to re-run; uses predictable demo IDs and
 * skips users that already have demo rows.
 *
 *   tsx --env-file=.env.local scripts/seed-demo-data.ts
 *   FORCE_PROD=1 tsx --env-file=.env.local scripts/seed-demo-data.ts
 */
import { db } from "../src/db";
import {
  users,
  classCredits,
  attendances,
  classSlots,
} from "../src/db/schema";
import { eq, and, like } from "drizzle-orm";

const HORIZON_WEEKS = 10;

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}
function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.FORCE_PROD !== "1") {
    console.error("Refused: NODE_ENV=production. Set FORCE_PROD=1 to proceed.");
    process.exit(1);
  }

  const allUsers = await db.select().from(users);
  console.log(`Found ${allUsers.length} users.`);

  // Pull real class_slots so attendances reference actual sessions; if none
  // exist, we generate synthetic slot ids that still work for stats.
  const slots = await db.select().from(classSlots);
  const slotPool: { id: string; classType: string }[] =
    slots.length > 0
      ? slots.map((s) => ({ id: s.id, classType: s.classType || "movement" }))
      : [
          { id: "demo-slot-yoga", classType: "yoga" },
          { id: "demo-slot-calisthenics", classType: "calisthenics" },
          { id: "demo-slot-run", classType: "run" },
          { id: "demo-slot-movement", classType: "movement" },
        ];

  const today = new Date();

  let updated = 0;
  for (const u of allUsers) {
    // Skip Catalin / Alexandru if you want real accounts untouched — comment out
    // the line below to also fake-stat the founders' accounts.
    if (u.role === "admin" && (u.email === "alexandrucojanu.com@gmail.com")) {
      console.log(`  skip admin ${u.email}`);
      continue;
    }

    // 1. Credits — ensure each user has some balance (10-40 active credits)
    const existingCredits = await db
      .select({ id: classCredits.id })
      .from(classCredits)
      .where(
        and(
          eq(classCredits.userId, u.id),
          like(classCredits.planName, "DEMO%"),
        ),
      )
      .limit(1);
    if (existingCredits.length === 0) {
      const creditCount = randInt(8, 30);
      const expiresAt = addDays(today, 90);
      const rows = Array.from({ length: creditCount }, () => ({
        userId: u.id,
        sourceType: "purchase" as const,
        planId: "demo-plan",
        planName: "DEMO Galaxy",
        purchasedAt: addDays(today, -randInt(0, 30)),
        expiresAt,
      }));
      await db.insert(classCredits).values(rows);
    }

    // 2. Attendances — sprinkle 4-18 sessions across the past HORIZON_WEEKS
    const existingAtt = await db
      .select({ slotId: attendances.slotId })
      .from(attendances)
      .where(eq(attendances.userId, u.id))
      .limit(1);
    if (existingAtt.length === 0) {
      const sessions = randInt(4, 18);
      const used = new Set<string>();
      for (let i = 0; i < sessions; i++) {
        const daysAgo = randInt(0, HORIZON_WEEKS * 7);
        const date = addDays(today, -daysAgo);
        const slotDate = isoDate(date);
        const slot = rand(slotPool);
        const key = `${slot.id}-${slotDate}`;
        if (used.has(key)) continue;
        used.add(key);
        await db
          .insert(attendances)
          .values({
            userId: u.id,
            slotId: slot.id,
            slotDate,
            method: "qr",
            validatedAt: new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate(),
              randInt(6, 21),
              randInt(0, 59),
            ),
            notes: "demo",
          })
          .onConflictDoNothing();
      }
    }

    updated++;
    process.stdout.write(`  seeded ${u.email}\n`);
  }

  console.log(`done. seeded ${updated} accounts.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
