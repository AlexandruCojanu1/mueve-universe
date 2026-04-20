// Simple in-memory sliding-window limiter. Per-process only — fine for single-instance dev
// and single-region Vercel serverless (each invocation shares if warm). For multi-region
// production, swap for Upstash Ratelimit.

type Bucket = { hits: number[]; };
const store = new Map<string, Bucket>();

export function rateLimit(key: string, maxHits: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = store.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= maxHits) {
    store.set(key, bucket);
    const oldest = bucket.hits[0] ?? now;
    return { ok: false, retryAfter: Math.max(0, windowMs - (now - oldest)) };
  }
  bucket.hits.push(now);
  store.set(key, bucket);
  return { ok: true, retryAfter: 0 };
}

export function clientKey(req: Request, suffix: string): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return `${suffix}:${ip}`;
}
