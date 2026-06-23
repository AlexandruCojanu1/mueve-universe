import { db } from "../src/db";
import {
  users,
  classCredits,
  attendances,
  classSlots,
} from "../src/db/schema";
import { eq } from "drizzle-orm";

const EMAIL = "alexcojanu10@icloud.com";

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

async function main() {
  const [u] = await db.select().from(users).where(eq(users.email, EMAIL)).limit(1);
  if (!u) {
    console.error(`User ${EMAIL} not found.`);
    process.exit(1);
  }
  console.log(`Found ${u.email} (id ${u.id})`);

  // 1. Wipe any demo data
  await db.delete(attendances).where(eq(attendances.userId, u.id));
  await db.delete(classCredits).where(eq(classCredits.userId, u.id));
  console.log("  wiped existing data");

  // 2. Get class slots to attend
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
  console.log(`  ${slotPool.length} slots in pool`);

  // 3. Credits — UNIVERSE plan, 100 classes, 6 months ahead
  const now = new Date();
  const expiresFar = addDays(now, 180);
  const creditRows = Array.from({ length: 100 }, () => ({
    userId: u.id,
    sourceType: "purchase" as const,
    planId: "plan-universe",
    planName: "UNIVERSE",
    purchasedAt: addDays(now, -10),
    expiresAt: expiresFar,
  }));
  await db.insert(classCredits).values(creditRows);
  console.log("  inserted 100 credits (UNIVERSE plan)");

  // 4. Attendances — 70 sessions over the last 20 weeks, ensuring no week gap
  //    (so currentStreak == 20 weeks → max streak)
  const inserted = new Set<string>();
  let dayCursor = addDays(now, -1); // start yesterday, walk backwards
  const WEEKS = 20;
  const SESSIONS_PER_WEEK = [4, 3, 4, 5, 3, 4, 4, 3, 4, 5, 3, 4, 4, 3, 4, 5, 3, 4, 4, 3];
  let totalAtt = 0;

  for (let w = 0; w < WEEKS; w++) {
    const sessions = SESSIONS_PER_WEEK[w] ?? 3;
    // For each session in this week, pick a day in [w*7, (w+1)*7) offset from
    // the current week start
    for (let s = 0; s < sessions; s++) {
      const dayOffsetInWeek = Math.floor(Math.random() * 7);
      const totalDayOffset = w * 7 + dayOffsetInWeek;
      const day = addDays(now, -totalDayOffset);
      const slot = slotPool[Math.floor(Math.random() * slotPool.length)];
      const slotDate = isoDate(day);
      const key = `${slot.id}-${slotDate}`;
      if (inserted.has(key)) continue;
      inserted.add(key);
      await db
        .insert(attendances)
        .values({
          userId: u.id,
          slotId: slot.id,
          slotDate,
          method: "qr",
          validatedAt: new Date(
            day.getFullYear(),
            day.getMonth(),
            day.getDate(),
            6 + Math.floor(Math.random() * 16),
            Math.floor(Math.random() * 60),
          ),
          notes: "demo-boosted",
        })
        .onConflictDoNothing();
      totalAtt++;
    }
    dayCursor = addDays(dayCursor, -7);
  }
  console.log(`  inserted ${totalAtt} attendances across 20 weeks`);

  console.log("DONE.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
