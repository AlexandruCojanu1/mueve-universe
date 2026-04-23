import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, partners, adminActions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateQrToken } from "@/lib/qr-token";
import { randomBytes } from "crypto";
import { hashPassword } from "@/lib/passwords";
import { sendEmail, emailEnabled, wrapBrandHtml } from "@/lib/mailer";
import { partnerCreateSchema, partnerPatchSchema } from "@/lib/validators";

function generateTempPassword(): string {
  return randomBytes(9).toString("base64").replace(/[+/=]/g, "").slice(0, 12);
}

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin" || !session.user.id || !session.user.email) {
    return {
      err: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { actorUserId: session.user.id, actorEmail: session.user.email };
}

export async function GET(req: Request) {
  const a = await requireAdmin();
  if ("err" in a) return a.err;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));
  const offset = Math.max(0, Number(searchParams.get("offset") || 0));
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
    .orderBy(partners.createdAt)
    .limit(limit + 1)
    .offset(offset);
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return NextResponse.json({
    partners: items,
    pagination: { limit, offset, hasMore },
  });
}

export async function POST(req: Request) {
  const a = await requireAdmin();
  if ("err" in a) return a.err;

  const raw = await req.json().catch(() => ({}));
  const parsed = partnerCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Date invalide" },
      { status: 400 },
    );
  }
  const body = parsed.data;
  const {
    email,
    companyName,
    discountPercent = 10,
    discountDescription = "",
    logoUrl: rawLogo,
  } = body;
  const logoUrl = rawLogo ? rawLogo : null;

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

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

  await db.insert(adminActions).values({
    actorUserId: a.actorUserId,
    actorEmail: a.actorEmail,
    action: "partner.create",
    targetType: "partner",
    targetId: created.id,
    metadata: { companyName, email, discountPercent },
  });

  const origin =
    process.env.NEXTAUTH_URL ||
    new URL(req.url).origin;
  const loginUrl = `${origin}/login`;

  let emailSent = false;
  if (emailEnabled()) {
    const result = await sendEmail({
      to: email,
      subject: `Bun venit în rețeaua MUEVE UNIVERSE — ${companyName}`,
      text: `Salut,

Echipa MUEVE UNIVERSE te-a adăugat ca partener cu o reducere de ${discountPercent}% pentru membri.

Intrare în cont:
Email: ${email}
Parolă temporară: ${tempPassword}
Login: ${loginUrl}

Recomandăm să îți schimbi parola după prima intrare (Setări cont).

Mișcă-te · Trăiește · Evoluează`,
      html: wrapBrandHtml({
        heading: `Bun venit, ${companyName}`,
        body: `<p>Echipa MUEVE UNIVERSE te-a adăugat ca partener cu o reducere de <strong>${discountPercent}%</strong> pentru membri activi.</p>
<p>Intrare în cont:</p>
<p><strong>Email:</strong> <code>${email}</code><br/>
<strong>Parolă temporară:</strong> <code style="background:rgba(245,245,10,.15);padding:4px 8px;border-radius:4px;color:#F5F50A">${tempPassword}</code></p>
<p style="opacity:.7;font-size:13px">Recomandăm să îți schimbi parola după prima intrare.</p>`,
        cta: { href: loginUrl, label: "Intră în cont" },
      }),
    });
    emailSent = result.ok;
  }

  return NextResponse.json({
    ok: true,
    partner: created,
    credentials: { email, tempPassword },
    emailSent,
  });
}

export async function PATCH(req: Request) {
  const a = await requireAdmin();
  if ("err" in a) return a.err;
  const parsed = partnerPatchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Date invalide" },
      { status: 400 },
    );
  }
  const body = parsed.data;
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (body.companyName !== undefined) set.companyName = body.companyName;
  if (body.discountPercent !== undefined) set.discountPercent = body.discountPercent;
  if (body.discountDescription !== undefined)
    set.discountDescription = body.discountDescription;
  if (body.logoUrl !== undefined) set.logoUrl = body.logoUrl || null;
  if (body.active !== undefined) set.active = body.active;

  const [updated] = await db
    .update(partners)
    .set(set)
    .where(eq(partners.id, body.id))
    .returning();

  await db.insert(adminActions).values({
    actorUserId: a.actorUserId,
    actorEmail: a.actorEmail,
    action: "partner.update",
    targetType: "partner",
    targetId: body.id,
    metadata: Object.fromEntries(
      Object.entries(set).filter(([k]) => k !== "updatedAt"),
    ),
  });

  return NextResponse.json({ ok: true, partner: updated });
}

export async function DELETE(req: Request) {
  const a = await requireAdmin();
  if ("err" in a) return a.err;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id lipsă" }, { status: 400 });

  // Soft-delete: deactivate instead of hard-deleting so visit history is preserved.
  const [updated] = await db
    .update(partners)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(partners.id, id))
    .returning({ id: partners.id, companyName: partners.companyName });

  if (!updated) {
    return NextResponse.json({ error: "Partener inexistent" }, { status: 404 });
  }

  await db.insert(adminActions).values({
    actorUserId: a.actorUserId,
    actorEmail: a.actorEmail,
    action: "partner.deactivate",
    targetType: "partner",
    targetId: id,
    metadata: { companyName: updated.companyName },
  });

  return NextResponse.json({ ok: true });
}
