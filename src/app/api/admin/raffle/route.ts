import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { appSettings, users } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { err: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { userId: session.user.id! };
}

export async function GET() {
  const r = await requireAdmin();
  if ("err" in r) return r.err;

  const [row] = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, "raffle"))
    .limit(1);

  const [counts] = await db
    .select({
      girls: sql<number>`count(*) filter (where ${users.gender} = 'feminin')::int`,
      boys: sql<number>`count(*) filter (where ${users.gender} = 'masculin')::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(users)
    .where(eq(users.role, "user"));

  return NextResponse.json({ raffle: row?.value ?? null, eligible: counts });
}

export async function POST() {
  const r = await requireAdmin();
  if ("err" in r) return r.err;

  const pick = async (gender: "feminin" | "masculin") => {
    const rows = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(and(eq(users.role, "user"), eq(users.gender, gender)))
      .orderBy(sql`random()`)
      .limit(1);
    return rows[0] ?? null;
  };

  const girl = await pick("feminin");
  const boy = await pick("masculin");

  if (!girl && !boy) {
    return NextResponse.json(
      { error: "Niciun membru eligibil (lipsesc userii cu gen declarat)." },
      { status: 400 },
    );
  }

  const value = { girl, boy, drawnAt: new Date().toISOString() };
  await db
    .insert(appSettings)
    .values({ key: "raffle", value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true, raffle: value });
}
