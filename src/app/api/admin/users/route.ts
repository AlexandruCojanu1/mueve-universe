import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, partners } from "@/db/schema";
import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { UserRole } from "@/db/schema";

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
  const limit = Math.min(200, Number(searchParams.get("limit") || 100));

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
    .limit(limit);

  return NextResponse.json({ users: rows });
}

export async function PATCH(req: Request) {
  const r = await requireAdmin();
  if ("err" in r) return r.err;

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    role?: UserRole;
  };
  if (!body.id || !body.role) {
    return NextResponse.json({ error: "id + role obligatorii" }, { status: 400 });
  }
  if (!VALID_ROLES.includes(body.role)) {
    return NextResponse.json({ error: "Rol invalid" }, { status: 400 });
  }
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
