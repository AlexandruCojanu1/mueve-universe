import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, attendances } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { consumeOldestCredit, getCreditBalance } from "@/lib/credits";

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

  let consumedCreditId: string | undefined;
  if (!force) {
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
