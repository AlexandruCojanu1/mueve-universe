import { NextResponse } from "next/server";
import { db } from "@/db";
import { raffleEntries } from "@/db/schema";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Public: register a launch-gate entry (name + email + gender). One per email. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    gender?: string;
  };

  const name = (body.name || "").trim().slice(0, 80);
  const email = (body.email || "").trim().toLowerCase().slice(0, 160);
  const gender = body.gender === "f" || body.gender === "m" ? body.gender : null;

  if (name.length < 2) {
    return NextResponse.json({ error: "Numele e prea scurt." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email invalid." }, { status: 400 });
  }
  if (!gender) {
    return NextResponse.json({ error: "Alege Fată sau Băiat." }, { status: 400 });
  }

  await db
    .insert(raffleEntries)
    .values({ name, email, gender })
    .onConflictDoUpdate({
      target: raffleEntries.email,
      set: { name, gender },
    });

  return NextResponse.json({ ok: true });
}
