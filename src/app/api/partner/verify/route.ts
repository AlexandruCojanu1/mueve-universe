import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, partners, partnerVisits } from "@/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { rateLimitAsync, clientKey } from "@/lib/rate-limit";
import { getActivePassRow } from "@/lib/credits";
import { verifyTokenSchema } from "@/lib/validators";

function extractToken(raw: string): string {
  const s = raw.trim();
  try {
    const u = new URL(s);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? s;
  } catch {
    return s;
  }
}

export async function POST(req: Request) {
  const rl = await rateLimitAsync(clientKey(req, "partner-verify"), 60, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const session = await auth();
  const role = session?.user?.role;
  const partnerUserId = session?.user?.id;
  if (!partnerUserId || role !== "partner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = verifyTokenSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Token lipsă" }, { status: 400 });
  }
  const token = extractToken(parsed.data.token);

  const partnerRows = await db
    .select()
    .from(partners)
    .where(eq(partners.userId, partnerUserId))
    .limit(1);
  const partner = partnerRows[0];
  if (!partner || !partner.active) {
    return NextResponse.json({ error: "Cont partener inactiv" }, { status: 403 });
  }

  const userRows = await db.select().from(users).where(eq(users.qrToken, token)).limit(1);
  const member = userRows[0];
  if (!member) {
    await db.insert(partnerVisits).values({
      partnerId: partner.id,
      userId: partnerUserId,
      memberEmail: "",
      valid: false,
      reason: "token necunoscut",
    });
    return NextResponse.json(
      { valid: false, reason: "Token necunoscut — QR invalid." },
      { status: 404 },
    );
  }

  const pass = await getActivePassRow(member.id);
  const valid = !!pass;

  const since = new Date(Date.now() - 60_000);
  const recent = await db
    .select({ id: partnerVisits.id })
    .from(partnerVisits)
    .where(
      and(
        eq(partnerVisits.partnerId, partner.id),
        eq(partnerVisits.userId, member.id),
        gte(partnerVisits.createdAt, since),
      ),
    )
    .orderBy(desc(partnerVisits.createdAt))
    .limit(1);

  if (recent.length === 0) {
    await db.insert(partnerVisits).values({
      partnerId: partner.id,
      userId: member.id,
      memberEmail: member.email,
      memberName: member.name,
      valid,
      reason: valid ? null : "Pass inactiv",
    });
  }

  return NextResponse.json({
    valid,
    member: {
      name: member.name,
      email: member.email,
      image: member.image,
    },
    pass: pass
      ? {
          planName: pass.planName,
          periodEnd: pass.currentPeriodEnd?.toISOString() ?? null,
        }
      : null,
    discount: {
      percent: partner.discountPercent,
      description: partner.discountDescription,
      company: partner.companyName,
      logoUrl: partner.logoUrl,
    },
    reason: valid ? null : "Membrul nu are Pass activ.",
  });
}
