import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, attendances, classSlots, reservations } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { rateLimitAsync, clientKey } from "@/lib/rate-limit";
import { consumeOldestCredit, getCreditBalance } from "@/lib/credits";
import { generateQrToken } from "@/lib/qr-token";
import { verifyDynamicToken } from "@/lib/qr-dynamic";

const SCAN_COOLDOWN_MS = 20 * 60 * 1000;

export async function POST(req: Request) {
  const rl = await rateLimitAsync(clientKey(req, "attend"), 120, 60_000);
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
  const { email, slotId, slotDate, force } = body;
  const method = body.method === "manual" ? "manual" : "qr";
  const rawToken = body.token?.toString().trim() || "";
  let token = rawToken;
  if (rawToken) {
    try {
      const u = new URL(rawToken);
      const parts = u.pathname.split("/").filter(Boolean);
      token = parts[parts.length - 1] || rawToken;
    } catch {}
  }

  if (!slotId || !slotDate) {
    return NextResponse.json({ error: "Lipsesc slotId / slotDate." }, { status: 400 });
  }
  if (!token && !email) {
    return NextResponse.json({ error: "Lipsește token sau email." }, { status: 400 });
  }

  const slotRows = await db
    .select()
    .from(classSlots)
    .where(eq(classSlots.id, slotId))
    .limit(1);
  const slot = slotRows[0];
  if (slot) {
    const d = new Date(`${slotDate}T00:00:00`);
    const jsDay = d.getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;
    if (dayOfWeek !== slot.dayOfWeek && !force) {
      return NextResponse.json(
        { error: "Data nu corespunde zilei slot-ului. force=true pentru override." },
        { status: 400 },
      );
    }
    if (!slot.active && !force) {
      return NextResponse.json(
        { error: "Slot inactiv. force=true pentru override." },
        { status: 400 },
      );
    }
  }

  // Token can be (a) a short-lived signed dynamic token (preferred — the
  // dashboard rotates it every ~30s so screenshots die fast), or (b) the
  // persistent qrToken baked into Apple/Google wallet passes.
  let user: typeof users.$inferSelect | undefined;
  if (token) {
    const dyn = verifyDynamicToken(token);
    if (dyn) {
      const rows = await db.select().from(users).where(eq(users.id, dyn.userId)).limit(1);
      user = rows[0];
    } else {
      const rows = await db.select().from(users).where(eq(users.qrToken, token)).limit(1);
      user = rows[0];
    }
  } else if (email) {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, String(email).trim().toLowerCase()))
      .limit(1);
    user = rows[0];
  }
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

  if (already) {
    const balance = await getCreditBalance(user.id);
    return NextResponse.json({
      ok: true,
      already: true,
      attendee: {
        userId: user.id,
        name: user.name,
        email: user.email,
        method,
        at: new Date().toISOString(),
        creditsRemaining: balance.total,
      },
    });
  }

  // Anti-sharing: same card cannot be scanned twice in <20 min on different slots.
  // Coach can still override with force=true (e.g. legitimate transfer between classes).
  if (user.lastScanAt && !force) {
    const elapsedMs = Date.now() - new Date(user.lastScanAt).getTime();
    if (elapsedMs < SCAN_COOLDOWN_MS) {
      const minutesLeft = Math.ceil((SCAN_COOLDOWN_MS - elapsedMs) / 60_000);
      return NextResponse.json(
        {
          ok: false,
          cooldown: true,
          error: `Cardul a fost folosit recent. Mai așteaptă ${minutesLeft} min sau retrimite cu force=true.`,
          attendee: {
            userId: user.id,
            name: user.name,
            email: user.email,
          },
        },
        { status: 429 },
      );
    }
  }

  if (slot && !force) {
    const countRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(attendances)
      .where(and(eq(attendances.slotId, slotId), eq(attendances.slotDate, slotDate)));
    const taken = countRows[0]?.count ?? 0;
    if (taken >= slot.capacity) {
      return NextResponse.json(
        {
          ok: false,
          full: true,
          error: `Slot plin (${taken}/${slot.capacity}). Retrimite cu force=true.`,
        },
        { status: 409 },
      );
    }
  }

  const existingReservation = await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.userId, user.id),
        eq(reservations.slotId, slotId),
        eq(reservations.slotDate, slotDate),
      ),
    )
    .limit(1);
  const hasActiveReservation =
    existingReservation[0]?.status === "active";

  let consumedCreditId: string | undefined;
  if (hasActiveReservation) {
    await db
      .update(reservations)
      .set({ status: "attended" })
      .where(
        and(
          eq(reservations.userId, user.id),
          eq(reservations.slotId, slotId),
          eq(reservations.slotDate, slotDate),
        ),
      );
    consumedCreditId = existingReservation[0].creditId ?? undefined;
  } else if (!force) {
    const res = await consumeOldestCredit({
      userId: user.id,
      slotId,
      slotDate,
    });
    if (!res.consumed) {
      const balance = await getCreditBalance(user.id);
      return NextResponse.json(
        {
          ok: false,
          noAccess: true,
          error: "Fără clase rămase. Retrimite cu force=true ca să marchezi oricum.",
          attendee: {
            userId: user.id,
            name: user.name,
            email: user.email,
            creditsRemaining: balance.total,
          },
        },
        { status: 402 },
      );
    }
    consumedCreditId = res.creditId;
  }

  await db.insert(attendances).values({
    userId: user.id,
    slotId,
    slotDate,
    method,
    validatedBy: coachId,
    notes: force
      ? "forced by coach (no credit consumed)"
      : consumedCreditId
        ? `credit:${consumedCreditId}`
        : null,
  });

  // Rotate the QR token + stamp lastScanAt so a previously screenshotted code
  // becomes worthless to whomever else holds it. The legitimate user gets a
  // fresh code on the next dashboard render (the card page auto-refreshes).
  await db
    .update(users)
    .set({ qrToken: generateQrToken(), lastScanAt: new Date() })
    .where(eq(users.id, user.id));

  const balance = await getCreditBalance(user.id);

  return NextResponse.json({
    ok: true,
    already: false,
    forced: !!force,
    attendee: {
      userId: user.id,
      name: user.name,
      email: user.email,
      method,
      at: new Date().toISOString(),
      creditsRemaining: balance.total,
    },
  });
}
