/**
 * Backfill the XP ledger (xp_events) from existing data so the new ledger-based
 * engine reports correct totals for members who earned XP before the cutover.
 *
 *   tsx --env-file=.env.local scripts/backfill-xp.ts
 *
 * Idempotent — safe to run repeatedly. Uses the same idempotency keys as the
 * live award path, so it never double-counts and never collides with XP that
 * was already awarded by a check-in / Strava sync.
 *
 * Historical events are banked at ×1.0 (no retroactive streak multiplier): XP
 * only ever goes up, nobody loses anything, and the numbers are deterministic.
 * Going forward, live check-ins/syncs apply the streak multiplier.
 */
import { db } from "@/db";
import { attendances, stravaActivities } from "@/db/schema";
import {
  awardXp,
  reconcileMilestones,
  awardStravaFirstSync,
  XP_PER_ATTENDANCE,
} from "@/lib/xp";

async function main() {
  let attendanceXp = 0;
  let stravaXp = 0;
  let milestoneXp = 0;

  // ── Attendances → attendance events (base 100, ×1.0) ──
  const att = await db
    .select({
      userId: attendances.userId,
      slotId: attendances.slotId,
      slotDate: attendances.slotDate,
    })
    .from(attendances);
  console.log(`Backfilling ${att.length} attendances…`);
  for (const a of att) {
    attendanceXp += await awardXp({
      userId: a.userId,
      source: "attendance",
      idempotencyKey: `attendance:${a.userId}:${a.slotId}:${a.slotDate}`,
      baseXp: XP_PER_ATTENDANCE,
      multiplierBp: 100,
      refId: a.slotId,
      occurredAt: new Date(`${a.slotDate}T12:00:00Z`),
      metadata: { slotDate: a.slotDate, backfill: true },
    });
  }

  // ── Strava activities → strava events (preserve recorded xpAwarded, ×1.0) ──
  const acts = await db
    .select({
      id: stravaActivities.id,
      userId: stravaActivities.userId,
      sportType: stravaActivities.sportType,
      distanceMeters: stravaActivities.distanceMeters,
      startedAt: stravaActivities.startedAt,
      xpAwarded: stravaActivities.xpAwarded,
    })
    .from(stravaActivities);
  console.log(`Backfilling ${acts.length} Strava activities…`);
  const stravaUsers = new Set<string>();
  for (const s of acts) {
    stravaUsers.add(s.userId);
    stravaXp += await awardXp({
      userId: s.userId,
      source: "strava",
      idempotencyKey: `strava:${s.id}`,
      baseXp: s.xpAwarded,
      multiplierBp: 100,
      refId: s.id,
      occurredAt: s.startedAt,
      metadata: {
        sportType: s.sportType,
        km: +(s.distanceMeters / 1000).toFixed(1),
        backfill: true,
      },
    });
  }

  // ── Milestones: sessions + streak per attending user, strava-first per syncer ──
  const userIds = new Set<string>([...att.map((a) => a.userId), ...stravaUsers]);
  console.log(`Reconciling milestones for ${userIds.size} users…`);
  for (const uid of userIds) {
    milestoneXp += await reconcileMilestones(uid);
  }
  for (const uid of stravaUsers) {
    milestoneXp += await awardStravaFirstSync(uid);
  }

  console.log("Done.");
  console.log(`  attendance XP awarded: ${attendanceXp}`);
  console.log(`  strava XP awarded:     ${stravaXp}`);
  console.log(`  milestone XP awarded:  ${milestoneXp}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
