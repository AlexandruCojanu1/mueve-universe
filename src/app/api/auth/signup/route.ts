import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  name: z.string().trim().min(1).max(120).optional(),
});

export async function POST(req: Request) {
  const rl = rateLimit(clientKey(req, "signup"), 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Prea multe încercări. Reîncearcă într-un minut." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfter / 1000)) } },
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Date invalide. Parola trebuie să aibă minim 8 caractere." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;
  const name = parsed.data.name?.trim() || null;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing[0]) {
    return NextResponse.json(
      { error: "Există deja un cont cu acest email. Autentifică-te." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({ email, passwordHash, name });

  return NextResponse.json({ ok: true });
}
