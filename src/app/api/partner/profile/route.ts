import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { partners } from "@/db/schema";
import { eq } from "drizzle-orm";

async function requirePartner() {
  const session = await auth();
  if (!session?.user?.id) {
    return { err: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  if (session.user.role !== "partner" && session.user.role !== "admin") {
    return { err: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { userId: session.user.id };
}

export async function GET() {
  const r = await requirePartner();
  if ("err" in r) return r.err;
  const rows = await db
    .select()
    .from(partners)
    .where(eq(partners.userId, r.userId))
    .limit(1);
  return NextResponse.json({ partner: rows[0] ?? null });
}

export async function PATCH(req: Request) {
  const r = await requirePartner();
  if ("err" in r) return r.err;
  const body = (await req.json().catch(() => ({}))) as {
    companyName?: string;
    discountDescription?: string;
    logoUrl?: string | null;
  };
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (body.companyName !== undefined) set.companyName = String(body.companyName);
  if (body.discountDescription !== undefined)
    set.discountDescription = String(body.discountDescription);
  if (body.logoUrl !== undefined) set.logoUrl = body.logoUrl || null;

  const [updated] = await db
    .update(partners)
    .set(set)
    .where(eq(partners.userId, r.userId))
    .returning();
  return NextResponse.json({ ok: true, partner: updated });
}
