import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { sections } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select()
    .from(sections)
    .where(eq(sections.type, "hero"))
    .limit(1);

  const row = rows[0];
  if (!row) return NextResponse.json({ error: "Hero section not found" }, { status: 404 });

  const data = row.data as Record<string, unknown>;

  const updated = {
    ...data,
    subBold: {
      ro: "Alergăm împreună gratuit. Construim împreună mai departe.",
      en: "We run together for free. We build together further.",
    },
    sub: {
      ro: "Universe Pass nu este un bilet de acces, ci o modalitate de a te bucura de beneficii premium și de a susține comunitatea Mueve.",
      en: "Universe Pass is not an entry ticket, but a way to enjoy premium benefits and support the Mueve community.",
    },
  };

  await db.update(sections).set({ data: updated }).where(eq(sections.id, row.id));

  return NextResponse.json({ ok: true, id: row.id });
}
