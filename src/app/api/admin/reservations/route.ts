import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { reservations, users } from "@/db/schema";
import { and, asc, eq, gte } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { err: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { userId: session.user.id! };
}

export async function GET(req: Request) {
  const r = await requireAdmin();
  if ("err" in r) return r.err;

  const slotId = new URL(req.url).searchParams.get("slotId");
  if (!slotId) return NextResponse.json({ error: "slotId lipsă" }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);
  const rows = await db
    .select({
      slotDate: reservations.slotDate,
      createdAt: reservations.createdAt,
      userEmail: users.email,
      userName: users.name,
    })
    .from(reservations)
    .innerJoin(users, eq(users.id, reservations.userId))
    .where(
      and(
        eq(reservations.slotId, slotId),
        eq(reservations.status, "active"),
        gte(reservations.slotDate, today),
      ),
    )
    .orderBy(asc(reservations.slotDate), asc(reservations.createdAt))
    .limit(200);

  return NextResponse.json({ reservations: rows });
}
