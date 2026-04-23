import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, classSlots } from "@/db/schema";
import { and, asc, eq, or } from "drizzle-orm";
import { slotCreateSchema, slotPatchSchema } from "@/lib/validators";

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
    .orderBy(asc(classSlots.dayOfWeek), asc(classSlots.startTime))
    .limit(500);

  const coaches = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(or(eq(users.role, "coach"), eq(users.role, "admin")))
    .orderBy(asc(users.name))
    .limit(200);

  return NextResponse.json({ slots: rows, coaches });
}

export async function POST(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  const parsed = slotCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Date invalide" },
      { status: 400 },
    );
  }
  const b = parsed.data;
  const [created] = await db
    .insert(classSlots)
    .values({
      coachId: b.coachId,
      dayOfWeek: b.dayOfWeek,
      startTime: b.startTime,
      durationMin: b.durationMin ?? 60,
      classType: b.classType ?? "",
      capacity: b.capacity ?? 20,
    })
    .returning();
  return NextResponse.json({ ok: true, slot: created });
}

export async function PATCH(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  const parsed = slotPatchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Date invalide" },
      { status: 400 },
    );
  }
  const body = parsed.data;
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (body.coachId !== undefined) set.coachId = body.coachId;
  if (body.dayOfWeek !== undefined) set.dayOfWeek = body.dayOfWeek;
  if (body.startTime !== undefined) set.startTime = body.startTime;
  if (body.durationMin !== undefined) set.durationMin = body.durationMin;
  if (body.classType !== undefined) set.classType = body.classType;
  if (body.capacity !== undefined) set.capacity = body.capacity;
  if (body.active !== undefined) set.active = body.active;

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
