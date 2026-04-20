import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, attendances, subscriptions, payments } from "@/db/schema";
import { and, eq, gte, inArray } from "drizzle-orm";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const ACTIVE_STATUSES = ["active", "trialing", "past_due"] as const;

export async function POST(req: Request) {
  const rl = rateLimit(clientKey(req, "attend"), 120, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  }
  const session = await auth();
  const role = session?.user?.role;
  const coachId = session?.user?.id;
  if (!coachId || (role !== "coach" && role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    token?: string;
    email?: string;
    slotId?: string;
    slotDate?: string;
    method?: "qr" | "manual";
    force?: boolean;
  };
  const { token, email, slotId, slotDate, force } = body;
  const method = body.method === "manual" ? "manual" : "qr";

  if (!slotId || !slotDate) {
    return NextResponse.json({ error: "Lipsesc slotId / slotDate." }, { status: 400 });
  }
  if (!token && !email) {
    return NextResponse.json({ error: "Lipsește token sau email." }, { status: 400 });
  }

  const where = token
    ? eq(users.qrToken, token)
    : eq(users.email, String(email).trim().toLowerCase());
  const rows = await db.select().from(users).where(where).limit(1);
  const user = rows[0];
  if (!user) {
    return NextResponse.json({ error: "Utilizator necunoscut." }, { status: 404 });
  }

  const existing = await db
    .select()
    .from(attendances)
    .where(
      and(
        eq(attendances.userId, user.id),
        eq(attendances.slotId, slotId),
        eq(attendances.slotDate, slotDate),
      ),
    )
    .limit(1);
  const already = existing.length > 0;

  let noAccess = false;
  if (!already && !force) {
    const activeSub = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, user.id),
          inArray(subscriptions.status, [...ACTIVE_STATUSES]),
        ),
      )
      .limit(1);

    let hasRecentClass = false;
    if (activeSub.length === 0) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentPayments = await db
        .select({ id: payments.id })
        .from(payments)
        .where(
          and(
            eq(payments.userId, user.id),
            eq(payments.mode, "payment"),
            gte(payments.createdAt, sevenDaysAgo),
          ),
        )
        .limit(1);
      hasRecentClass = recentPayments.length > 0;
    }

    if (activeSub.length === 0 && !hasRecentClass) {
      noAccess = true;
    }
  }

  if (noAccess) {
    return NextResponse.json(
      {
        ok: false,
        noAccess: true,
        error: "Fără abonament activ. Retrimite cu force=true dacă accepți oricum.",
        attendee: { userId: user.id, name: user.name, email: user.email },
      },
      { status: 402 },
    );
  }

  if (!already) {
    await db.insert(attendances).values({
      userId: user.id,
      slotId,
      slotDate,
      method,
      validatedBy: coachId,
      notes: force ? "forced by coach" : null,
    });
  }

  return NextResponse.json({
    ok: true,
    already,
    forced: !!force,
    attendee: {
      userId: user.id,
      name: user.name,
      email: user.email,
      method,
      at: new Date().toISOString(),
    },
  });
}
