import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { rateLimitAsync, clientKey } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/passwords";

const schema = z.object({
  email: z.string().email().max(200),
  token: z.string().min(20).max(200),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  const rl = await rateLimitAsync(clientKey(req, "reset"), 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Prea multe încercări. Reîncearcă într-un minut." },
      { status: 429 },
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
  const identifier = `reset:${email}`;

  const tokenRows = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, identifier),
        eq(verificationTokens.token, parsed.data.token),
      ),
    )
    .limit(1);

  const row = tokenRows[0];
  if (!row || row.expires.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "Link invalid sau expirat. Cere altul." },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db.update(users).set({ passwordHash }).where(eq(users.email, email));

  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, identifier),
        eq(verificationTokens.token, parsed.data.token),
      ),
    );

  return NextResponse.json({ ok: true });
}
