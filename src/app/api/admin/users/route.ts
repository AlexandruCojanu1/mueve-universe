import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, partners, classSlots } from "@/db/schema";
import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { UserRole } from "@/db/schema";
import { userPatchSchema } from "@/lib/validators";

const VALID_ROLES: UserRole[] = ["user", "coach", "admin", "partner"];

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return {
      err: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { userId: session.user.id! };
}

export async function GET(req: Request) {
  const r = await requireAdmin();
  if ("err" in r) return r.err;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const role = searchParams.get("role") || "";
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));
  const offset = Math.max(0, Number(searchParams.get("offset") || 0));

  const conds: SQL[] = [];
  if (q) {
    const c = or(ilike(users.email, `%${q}%`), ilike(users.name, `%${q}%`));
    if (c) conds.push(c);
  }
  if (VALID_ROLES.includes(role as UserRole)) {
    conds.push(eq(users.role, role as UserRole));
  }

  const where =
    conds.length === 0 ? undefined : conds.length === 1 ? conds[0] : and(...conds);

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
      emailVerified: users.emailVerified,
      hasPartnerProfile: sql<boolean>`${partners.id} is not null`,
    })
    .from(users)
    .leftJoin(partners, eq(partners.userId, users.id))
    .where(where)
    .orderBy(desc(users.createdAt), asc(users.email))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return NextResponse.json({
    users: items,
    pagination: { limit, offset, hasMore },
  });
}

export async function PATCH(req: Request) {
  const r = await requireAdmin();
  if ("err" in r) return r.err;

  const parsed = userPatchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Date invalide" },
      { status: 400 },
    );
  }
  const body = parsed.data;
  if (body.id === r.userId && body.role !== "admin") {
    return NextResponse.json(
      { error: "Nu te poți demota singur (măsură de siguranță)." },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(users)
    .set({ role: body.role })
    .where(eq(users.id, body.id))
    .returning({ id: users.id, email: users.email, role: users.role });

  const notes: string[] = [];
  if (body.role !== "partner") {
    const partnerRow = await db
      .select({ id: partners.id })
      .from(partners)
      .where(eq(partners.userId, body.id))
      .limit(1);
    if (partnerRow[0]) {
      notes.push(
        "Userul are profil de partener activ. Dezactivează-l din /admin/partners dacă nu mai e partener.",
      );
    }
  } else {
    const partnerRow = await db
      .select({ id: partners.id })
      .from(partners)
      .where(eq(partners.userId, body.id))
      .limit(1);
    if (!partnerRow[0]) {
      notes.push(
        "Role setat pe partener, dar profilul nu există. Creează-l din /admin/partners.",
      );
    }
  }

  return NextResponse.json({ ok: true, user: updated, notes });
}

export async function DELETE(req: Request) {
  const r = await requireAdmin();
  if ("err" in r) return r.err;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id lipsă" }, { status: 400 });
  if (id === r.userId) {
    return NextResponse.json(
      { error: "Nu te poți șterge singur (măsură de siguranță)." },
      { status: 400 },
    );
  }

  // Deleting a coach would cascade-delete their class slots (the whole
  // schedule). Force reassigning the slots first.
  const [slotCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(classSlots)
    .where(eq(classSlots.coachId, id));
  if (slotCount.n > 0) {
    return NextResponse.json(
      {
        error: `Userul e coach pe ${slotCount.n} slot(uri). Mută sloturile pe alt coach din Slots înainte de ștergere.`,
      },
      { status: 409 },
    );
  }

  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning({ id: users.id, email: users.email });
  if (!deleted) {
    return NextResponse.json({ error: "User inexistent" }, { status: 404 });
  }
  // FK cascades remove attendances, payments, subscriptions, credits,
  // reservations, xp_events etc.
  return NextResponse.json({ ok: true, deleted });
}
