import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimitAsync, clientKey } from "@/lib/rate-limit";
import { sendEmail, emailEnabled, wrapBrandHtml } from "@/lib/mailer";

const schema = z.object({ email: z.string().email().max(200) });

export async function POST(req: Request) {
  const start = Date.now();
  const rl = await rateLimitAsync(clientKey(req, "forgot"), 3, 60_000);
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

  // Pad response to constant ~600ms so email-exists vs email-missing
  // cannot be distinguished via timing.
  const padToConstantTime = async () => {
    const elapsed = Date.now() - start;
    const target = 600;
    if (elapsed < target) {
      await new Promise((r) => setTimeout(r, target - elapsed));
    }
  };

  // Always respond ok=true to avoid leaking which emails have accounts.
  if (!rows[0]) {
    await padToConstantTime();
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

  if (emailEnabled()) {
    await sendEmail({
      to: email,
      subject: "Resetează parola MUEVE UNIVERSE",
      text: `Am primit o cerere de resetare a parolei. Linkul e valabil 1 oră:\n\n${resetUrl}\n\nDacă n-ai cerut tu, ignoră acest email.`,
      html: wrapBrandHtml({
        heading: "Resetează-ți parola",
        body: `<p>Am primit o cerere de resetare. Linkul e valabil <strong>1 oră</strong>.</p><p style="opacity:.7;font-size:13px">Dacă n-ai cerut tu, poți ignora acest email — parola rămâne nemodificată.</p>`,
        cta: { href: resetUrl, label: "Setează parolă nouă" },
      }),
    });
  } else {
    console.log(`[forgot-password] email not configured; reset URL: ${resetUrl}`);
  }

  await padToConstantTime();
  return NextResponse.json({ ok: true });
}
