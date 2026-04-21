import * as Sentry from "@sentry/nextjs";

let initialized = false;

export function initSentry(context: "server" | "client" | "edge"): void {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_RATE ?? 0.1),
    enabled: true,
    initialScope: { tags: { runtime: context } },
  });
  initialized = true;
}

export function captureError(err: unknown, extra?: Record<string, unknown>): void {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.error("[capture]", err, extra);
    return;
  }
  Sentry.captureException(err, { extra });
}

export function sentryEnabled(): boolean {
  return !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
}
