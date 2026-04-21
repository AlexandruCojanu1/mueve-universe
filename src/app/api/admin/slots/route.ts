import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, classSlots } from "@/db/schema";
import { and, asc, eq, or } from "drizzle-orm";

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
      id: classSlots.id,
      coachId: classSlots.coachId,
      coachName: users.name,
      coachEmail: users.email,
      dayOfWeek: classSlots.dayOfWeek,
      startTime: classSlots.startTime,
      durationMin: classSlots.durationMin,
      classType: classSlots.classType,
      capacity: classSlots.capacity,
      active: classSlots.active,
    })
    .from(classSlots)
    .innerJoin(users, eq(users.id, classSlots.coachId))
    .orderBy(asc(classSlots.dayOfWeek), asc(classSlots.startTime));

  const coaches = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(or(eq(users.role, "coach"), eq(users.role, "admin")))
    .orderBy(asc(users.name));

  return NextResponse.json({ slots: rows, coaches });
}

export async function POST(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  const body = (await req.json().catch(() => ({}))) as {
    coachId?: string;
    dayOfWeek?: number;
    startTime?: string;
    durationMin?: number;
    classType?: string;
    capacity?: number;
  };
  if (!body.coachId || body.dayOfWeek === undefined || !body.startTime) {
    return NextResponse.json(
      { error: "coachId, dayOfWeek, startTime obligatorii" },
      { status: 400 },
    );
  }
  const [created] = await db
    .insert(classSlots)
    .values({
      coachId: body.coachId,
      dayOfWeek: Number(body.dayOfWeek),
      startTime: String(body.startTime),
      durationMin: Number(body.durationMin ?? 60),
      classType: String(body.classType ?? ""),
      capacity: Number(body.capacity ?? 20),
    })
    .returning();
  return NextResponse.json({ ok: true, slot: created });
}

export async function PATCH(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    coachId?: string;
    dayOfWeek?: number;
    startTime?: string;
    durationMin?: number;
    classType?: string;
    capacity?: number;
    active?: boolean;
  };
  if (!body.id) return NextResponse.json({ error: "id lipsă" }, { status: 400 });
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (body.coachId !== undefined) set.coachId = body.coachId;
  if (body.dayOfWeek !== undefined) set.dayOfWeek = Number(body.dayOfWeek);
  if (body.startTime !== undefined) set.startTime = String(body.startTime);
  if (body.durationMin !== undefined) set.durationMin = Number(body.durationMin);
  if (body.classType !== undefined) set.classType = String(body.classType);
  if (body.capacity !== undefined) set.capacity = Number(body.capacity);
  if (body.active !== undefined) set.active = !!body.active;

  const [updated] = await db
    .update(classSlots)
    .set(set)
    .where(eq(classSlots.id, body.id))
    .returning();
  return NextResponse.json({ ok: true, slot: updated });
}

export async function DELETE(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id lipsă" }, { status: 400 });
  await db.delete(classSlots).where(eq(classSlots.id, id));
  return NextResponse.json({ ok: true });
}
