import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email().max(200) });

export async function POST(req: Request) {
  const rl = rateLimit(clientKey(req, "forgot"), 3, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Prea multe încercări. Reîncearcă într-un minut." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfter / 1000)) } },
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email invalid." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Always respond ok=true to avoid leaking which emails have accounts.
  if (!rows[0]) {
    return NextResponse.json({ ok: true });
  }

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  const identifier = `reset:${email}`;

  await db.insert(verificationTokens).values({ identifier, token, expires });

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    new URL(req.url).origin;
  const resetUrl = `${origin}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
    try {
      const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER);
      await transporter.sendMail({
        to: email,
        from: process.env.EMAIL_FROM,
        subject: "Resetează parola MUEVE UNIVERSE",
        text: `Am primit o cerere de resetare a parolei. Linkul e valabil 1 oră:\n\n${resetUrl}\n\nDacă n-ai cerut tu, ignoră acest email.`,
        html: `<p>Am primit o cerere de resetare a parolei. Linkul e valabil 1 oră:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Dacă n-ai cerut tu, ignoră acest email.</p>`,
      });
    } catch (err) {
      console.error("forgot-password email failed", err);
    }
  } else {
    console.log(`[forgot-password] email not configured; reset URL: ${resetUrl}`);
  }

  return NextResponse.json({ ok: true });
}
