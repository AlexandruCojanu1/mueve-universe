import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import AuthShell from "@/components/auth/AuthShell";

export const dynamic = "force-dynamic";

type Status = "ok" | "expired" | "invalid" | "missing";

async function consume(email: string, token: string): Promise<Status> {
  if (!email || !token) return "missing";
  const identifier = `verify:${email.toLowerCase()}`;
  const consumed = await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, identifier),
        eq(verificationTokens.token, token),
      ),
    )
    .returning();
  const row = consumed[0];
  if (!row) return "invalid";
  if (row.expires.getTime() < Date.now()) return "expired";
  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, email.toLowerCase()));
  return "ok";
}

const COPY: Record<Status, { eyebrow: string; headline: string; sub: string }> = {
  ok: {
    eyebrow: "Cont activat",
    headline: "Email confirmat",
    sub: "Mulțumim! Contul tău e activ. Te poți autentifica.",
  },
  expired: {
    eyebrow: "Link expirat",
    headline: "Linkul nu mai e valabil",
    sub: "Trimite din nou o cerere de confirmare de pe pagina de login.",
  },
  invalid: {
    eyebrow: "Link invalid",
    headline: "Link invalid sau folosit",
    sub: "Linkul nu e valid sau a fost deja folosit. Cere unul nou.",
  },
  missing: {
    eyebrow: "Date lipsă",
    headline: "Lipsesc date din link",
    sub: "Linkul de confirmare nu conține emailul sau tokenul.",
  },
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const sp = await searchParams;
  const status = await consume((sp.email ?? "").trim(), (sp.token ?? "").trim());
  const m = COPY[status];

  return (
    <AuthShell eyebrow={m.eyebrow} headline={m.headline} sub={m.sub}>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
        <Link
          href="/login"
          style={{
            background: "#F5F50A",
            color: "#050816",
            padding: "12px 28px",
            borderRadius: 999,
            fontWeight: 900,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          Mergi la login
        </Link>
      </div>
    </AuthShell>
  );
}
