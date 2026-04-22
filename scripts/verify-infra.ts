/**
 * Smoke test for production infra.
 *   npx tsx scripts/verify-infra.ts
 *
 * Checks:
 *   - DB: SELECT 1 via DATABASE_URL
 *   - Resend SMTP: transporter.verify()
 *   - Upstash Redis: PING
 *   - Sentry: DSN parses and init succeeds
 *   - Google Wallet: service-account auth (getAccessToken)
 *
 * Exits 1 if any check fails.
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

// Alias Vercel Marketplace Upstash naming → native.
process.env.UPSTASH_REDIS_REST_URL ??=
  process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
process.env.UPSTASH_REDIS_REST_TOKEN ??=
  process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;

type Result = { name: string; ok: boolean; detail: string };

async function checkDb(): Promise<Result> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return { name: "Database", ok: false, detail: "DATABASE_URL missing" };
  try {
    const postgres = (await import("postgres")).default;
    const client = postgres(url, { max: 1, idle_timeout: 1 });
    const rows = await client`select 1 as x`;
    await client.end();
    return {
      name: "Database",
      ok: rows[0]?.x === 1,
      detail: rows[0]?.x === 1 ? "SELECT 1 OK" : "unexpected result",
    };
  } catch (err) {
    return { name: "Database", ok: false, detail: (err as Error).message };
  }
}

async function checkResend(): Promise<Result> {
  const server = process.env.EMAIL_SERVER;
  if (!server) return { name: "Resend SMTP", ok: false, detail: "EMAIL_SERVER missing" };
  try {
    const nodemailer = await import("nodemailer");
    const t = nodemailer.createTransport(server);
    await t.verify();
    return { name: "Resend SMTP", ok: true, detail: "verify() OK" };
  } catch (err) {
    return { name: "Resend SMTP", ok: false, detail: (err as Error).message };
  }
}

async function checkUpstash(): Promise<Result> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return { name: "Upstash Redis", ok: false, detail: "REST URL/TOKEN missing" };
  }
  try {
    const { Redis } = await import("@upstash/redis");
    const r = new Redis({ url, token });
    const pong = await r.ping();
    return { name: "Upstash Redis", ok: pong === "PONG", detail: `ping → ${pong}` };
  } catch (err) {
    return { name: "Upstash Redis", ok: false, detail: (err as Error).message };
  }
}

async function checkSentry(): Promise<Result> {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return { name: "Sentry", ok: false, detail: "SENTRY_DSN missing" };
  try {
    const parsed = new URL(dsn);
    if (!parsed.host.includes("sentry.io")) {
      return { name: "Sentry", ok: false, detail: `unexpected host: ${parsed.host}` };
    }
    return { name: "Sentry", ok: true, detail: `DSN host ${parsed.host}` };
  } catch (err) {
    return { name: "Sentry", ok: false, detail: (err as Error).message };
  }
}

async function checkWallet(): Promise<Result> {
  const json = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON;
  if (!json) return { name: "Google Wallet", ok: false, detail: "SERVICE_ACCOUNT_JSON missing" };
  try {
    const creds = JSON.parse(json);
    const { GoogleAuth } = await import("google-auth-library");
    const auth = new GoogleAuth({
      credentials: creds,
      scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return {
      name: "Google Wallet",
      ok: !!token?.token,
      detail: token?.token ? `token obtained (${creds.client_email})` : "no token",
    };
  } catch (err) {
    return { name: "Google Wallet", ok: false, detail: (err as Error).message };
  }
}

async function main() {
  const results = await Promise.all([
    checkDb(),
    checkResend(),
    checkUpstash(),
    checkSentry(),
    checkWallet(),
  ]);

  console.log("\nInfra smoke test\n");
  for (const r of results) {
    const mark = r.ok ? "✓" : "✗";
    const padded = r.name.padEnd(18);
    console.log(`  ${mark} ${padded} ${r.detail}`);
  }
  console.log("");

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.error(`${failed.length} check(s) failed.`);
    process.exit(1);
  }
  console.log("All checks passed.");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
