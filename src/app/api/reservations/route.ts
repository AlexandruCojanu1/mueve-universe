import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  classSlots,
  reservations,
  attendances,
  classCredits,
} from "@/db/schema";
import { and, asc, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { rateLimitAsync, clientKey } from "@/lib/rate-limit";
import { reservationCreateSchema } from "@/lib/validators";

function toDayOfWeek(date: Date): number {
  const js = date.getDay();
  return js === 0 ? 7 : js;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rows = await db
    .select({
      userId: reservations.userId,
      slotId: reservations.slotId,
      slotDate: reservations.slotDate,
      status: reservations.status,
      createdAt: reservations.createdAt,
      cancelledAt: reservations.cancelledAt,
      startTime: classSlots.startTime,
      durationMin: classSlots.durationMin,
      classType: classSlots.classType,
      dayOfWeek: classSlots.dayOfWeek,
    })
    .from(reservations)
    .innerJoin(classSlots, eq(classSlots.id, reservations.slotId))
    .where(eq(reservations.userId, session.user.id))
    .orderBy(desc(reservations.slotDate), desc(classSlots.startTime));
  return NextResponse.json({ reservations: rows });
}

export async function POST(req: Request) {
  const rl = await rateLimitAsync(clientKey(req, "reserve"), 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = reservationCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Date invalide" },
      { status: 400 },
    );
  }
  const body = parsed.data;
  const d = new Date(`${body.slotDate}T00:00:00`);
  if (Number.isNaN(d.valueOf())) {
    return NextResponse.json({ error: "Dată invalidă" }, { status: 400 });
  }
  const slotRows = await db
    .select()
    .from(classSlots)
    .where(eq(classSlots.id, body.slotId))
    .limit(1);
  const slot = slotRows[0];
  if (!slot || !slot.active) {
    return NextResponse.json({ error: "Slot inexistent sau inactiv" }, { status: 404 });
  }
  if (toDayOfWeek(d) !== slot.dayOfWeek) {
    return NextResponse.json(
      { error: "Data aleasă nu cade în ziua slot-ului." },
      { status: 400 },
    );
  }
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (d < startOfToday) {
    return NextResponse.json(
      { error: "Nu se pot rezerva date trecute." },
      { status: 400 },
    );
  }

  const dup = await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.userId, session.user.id),
        eq(reservations.slotId, body.slotId),
        eq(reservations.slotDate, body.slotDate),
      ),
    )
    .limit(1);
  if (dup[0] && dup[0].status === "active") {
    return NextResponse.json({ error: "Ai deja rezervare activă." }, { status: 409 });
  }

  const activeCount = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(reservations)
    .where(
      and(
        eq(reservations.slotId, body.slotId),
        eq(reservations.slotDate, body.slotDate),
        eq(reservations.status, "active"),
      ),
    );
  // Outdoor (unlimited) sessions ignore capacity entirely.
  if (!slot.unlimited && (activeCount[0]?.c ?? 0) >= slot.capacity) {
    return NextResponse.json(
      { error: `Slot plin (${activeCount[0]?.c}/${slot.capacity}).`, full: true },
      { status: 409 },
    );
  }

  const now = new Date();
  // Free sessions (e.g. The Big Social Run) don't require or consume a credit.
  let creditId: string | null = null;
  if (!slot.free) {
    const creditRows = await db
      .select({ id: classCredits.id })
      .from(classCredits)
      .where(
        and(
          eq(classCredits.userId, session.user.id),
          isNull(classCredits.consumedAt),
          gte(classCredits.expiresAt, now),
        ),
      )
      .orderBy(asc(classCredits.expiresAt))
      .limit(1);
    const credit = creditRows[0];
    if (!credit) {
      return NextResponse.json(
        { error: "Fără clase rămase.", noCredit: true },
        { status: 402 },
      );
    }

    const updated = await db
      .update(classCredits)
      .set({
        consumedAt: now,
        consumedSlotId: body.slotId,
        consumedSlotDate: body.slotDate,
      })
      .where(and(eq(classCredits.id, credit.id), isNull(classCredits.consumedAt)))
      .returning({ id: classCredits.id });

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Creditul nu mai este disponibil." },
        { status: 409 },
      );
    }
    creditId = credit.id;
  }

  if (dup[0]) {
    await db
      .update(reservations)
      .set({
        status: "active",
        creditId,
        cancelledAt: null,
        createdAt: new Date(),
      })
      .where(
        and(
          eq(reservations.userId, session.user.id),
          eq(reservations.slotId, body.slotId),
          eq(reservations.slotDate, body.slotDate),
        ),
      );
  } else {
    await db.insert(reservations).values({
      userId: session.user.id,
      slotId: body.slotId,
      slotDate: body.slotDate,
      status: "active",
      creditId,
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const slotId = searchParams.get("slotId");
  const slotDate = searchParams.get("slotDate");
  if (!slotId || !slotDate) {
    return NextResponse.json({ error: "Lipsesc parametri" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.userId, session.user.id),
        eq(reservations.slotId, slotId),
        eq(reservations.slotDate, slotDate),
      ),
    )
    .limit(1);
  const r = rows[0];
  if (!r) {
    return NextResponse.json({ error: "Rezervare inexistentă" }, { status: 404 });
  }
  if (r.status !== "active") {
    return NextResponse.json({ error: "Deja procesată" }, { status: 409 });
  }

  const d = new Date(`${slotDate}T00:00:00`);
  const twoHoursBefore = new Date(d.getTime() - 2 * 3600 * 1000);
  const late = new Date() > twoHoursBefore;

  const already = await db
    .select()
    .from(attendances)
    .where(
      and(
        eq(attendances.userId, session.user.id),
        eq(attendances.slotId, slotId),
        eq(attendances.slotDate, slotDate),
      ),
    )
    .limit(1);
  if (already[0]) {
    return NextResponse.json(
      { error: "Ai fost deja marcat prezent." },
      { status: 409 },
    );
  }

  await db
    .update(reservations)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(
      and(
        eq(reservations.userId, session.user.id),
        eq(reservations.slotId, slotId),
        eq(reservations.slotDate, slotDate),
      ),
    );

  if (!late && r.creditId) {
    await db
      .update(classCredits)
      .set({
        consumedAt: null,
        consumedSlotId: null,
        consumedSlotDate: null,
      })
      .where(eq(classCredits.id, r.creditId));
  }

  return NextResponse.json({
    ok: true,
    creditRefunded: !late,
    cancelPenalty: late,
  });
}
