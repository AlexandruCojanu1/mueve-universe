import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimitAsync, clientKey } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/passwords";
import { sendEmail, emailEnabled, wrapBrandHtml } from "@/lib/mailer";

const schema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  name: z.string().trim().min(1).max(120).optional(),
});

export async function POST(req: Request) {
  const rl = await rateLimitAsync(clientKey(req, "signup"), 5, 60_000);
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

  const passwordHash = await hashPassword(password);
  await db.insert(users).values({ email, passwordHash, name });

  // Send verification email (best-effort — signup still succeeds if mailer fails).
  if (emailEnabled()) {
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    const identifier = `verify:${email}`;
    await db.insert(verificationTokens).values({ identifier, token, expires });

    const origin =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      new URL(req.url).origin;
    const verifyUrl = `${origin}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    await sendEmail({
      to: email,
      subject: "Confirmă-ți emailul — MUEVE UNIVERSE",
      text: `Salut${name ? " " + name : ""},\n\nConfirmă-ți emailul ca să-ți activezi contul. Linkul e valabil 24 de ore:\n\n${verifyUrl}\n\nDacă n-ai cerut tu, ignoră acest email.`,
      html: wrapBrandHtml({
        heading: "Confirmă-ți emailul",
        body: `<p>Bun venit în MUEVE UNIVERSE${name ? `, ${name}` : ""}!</p><p>Apasă butonul de mai jos ca să-ți activezi contul. Linkul e valabil <strong>24 de ore</strong>.</p>`,
        cta: { href: verifyUrl, label: "Confirmă emailul" },
      }),
    });
  }

  return NextResponse.json({ ok: true });
}
