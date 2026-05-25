import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let body: { name?: unknown } = {};
  try {
    body = (await req.json()) as { name?: unknown };
  } catch {
    /* fall through to validation */
  }

  const raw = typeof body.name === "string" ? body.name : "";
  const name = raw.trim().replace(/\s+/g, " ");

  if (name.length < 2 || name.length > 60) {
    return NextResponse.json(
      { error: "Numele trebuie să aibă între 2 și 60 de caractere." },
      { status: 400 },
    );
  }
  if (name.includes("@")) {
    return NextResponse.json(
      { error: "Introdu numele tău, nu un email." },
      { status: 400 },
    );
  }

  await db.update(users).set({ name }).where(eq(users.id, session.user.id));
  return NextResponse.json({ ok: true, name });
}
