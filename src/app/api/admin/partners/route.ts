import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, partners } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateQrToken } from "@/lib/qr-token";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

function generateTempPassword(): string {
  return randomBytes(9).toString("base64").replace(/[+/=]/g, "").slice(0, 12);
}

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  const rows = await db
    .select({
      partnerId: partners.id,
      companyName: partners.companyName,
      discountPercent: partners.discountPercent,
      discountDescription: partners.discountDescription,
      logoUrl: partners.logoUrl,
      active: partners.active,
      userId: users.id,
      email: users.email,
      name: users.name,
      createdAt: partners.createdAt,
    })
    .from(partners)
    .innerJoin(users, eq(users.id, partners.userId))
    .orderBy(partners.createdAt);
  return NextResponse.json({ partners: rows });
}

export async function POST(req: Request) {
  const err = await requireAdmin();
  if (err) return err;

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
    companyName?: string;
    discountPercent?: number;
    discountDescription?: string;
    logoUrl?: string;
  };
  const email = String(body.email || "").trim().toLowerCase();
  const companyName = String(body.companyName || "").trim();
  const discountPercent = Math.max(0, Math.min(100, Number(body.discountPercent ?? 10)));
  const discountDescription = String(body.discountDescription || "").trim();
  const logoUrl = body.logoUrl ? String(body.logoUrl).trim() : null;

  if (!email || !companyName) {
    return NextResponse.json(
      { error: "Email și nume firmă obligatorii." },
      { status: 400 },
    );
  }

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  let userId: string;
  if (existingUser[0]) {
    const u = existingUser[0];
    userId = u.id;
    await db
      .update(users)
      .set({
        role: "partner",
        name: u.name || body.name || companyName,
        qrToken: u.qrToken ?? generateQrToken(),
        passwordHash,
        emailVerified: u.emailVerified ?? new Date(),
      })
      .where(eq(users.id, u.id));

    const existingPartner = await db
      .select()
      .from(partners)
      .where(eq(partners.userId, u.id))
      .limit(1);
    if (existingPartner[0]) {
      return NextResponse.json(
        { error: "Partenerul există deja.", partnerId: existingPartner[0].id },
        { status: 409 },
      );
    }
  } else {
    const inserted = await db
      .insert(users)
      .values({
        email,
        name: body.name || companyName,
        role: "partner",
        qrToken: generateQrToken(),
        passwordHash,
        emailVerified: new Date(),
      })
      .returning({ id: users.id });
    userId = inserted[0].id;
  }

  const [created] = await db
    .insert(partners)
    .values({
      userId,
      companyName,
      discountPercent,
      discountDescription,
      logoUrl,
    })
    .returning();

  return NextResponse.json({
    ok: true,
    partner: created,
    credentials: { email, tempPassword },
  });
}

export async function PATCH(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    companyName?: string;
    discountPercent?: number;
    discountDescription?: string;
    logoUrl?: string | null;
    active?: boolean;
  };
  if (!body.id) return NextResponse.json({ error: "id lipsă" }, { status: 400 });

  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (body.companyName !== undefined) set.companyName = String(body.companyName);
  if (body.discountPercent !== undefined)
    set.discountPercent = Math.max(0, Math.min(100, Number(body.discountPercent)));
  if (body.discountDescription !== undefined)
    set.discountDescription = String(body.discountDescription);
  if (body.logoUrl !== undefined) set.logoUrl = body.logoUrl;
  if (body.active !== undefined) set.active = !!body.active;

  const [updated] = await db
    .update(partners)
    .set(set)
    .where(eq(partners.id, body.id))
    .returning();
  return NextResponse.json({ ok: true, partner: updated });
}

export async function DELETE(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id lipsă" }, { status: 400 });
  await db.delete(partners).where(eq(partners.id, id));
  return NextResponse.json({ ok: true });
}
