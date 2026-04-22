import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Vercel Marketplace exposes Upstash with prefixed names; alias to native.
process.env.UPSTASH_REDIS_REST_URL ??=
  process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
process.env.UPSTASH_REDIS_REST_TOKEN ??=
  process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;

type RLResult = { ok: boolean; retryAfter: number };

// In-memory sliding-window limiter for dev / when Upstash isn't configured.
type Bucket = { hits: number[] };
const memoryStore = new Map<string, Bucket>();

function memoryLimit(key: string, maxHits: number, windowMs: number): RLResult {
  const now = Date.now();
  const bucket = memoryStore.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= maxHits) {
    memoryStore.set(key, bucket);
    const oldest = bucket.hits[0] ?? now;
    return { ok: false, retryAfter: Math.max(0, windowMs - (now - oldest)) };
  }
  bucket.hits.push(now);
  memoryStore.set(key, bucket);
  return { ok: true, retryAfter: 0 };
}

let redis: Redis | null = null;
let redisTried = false;
function getRedis(): Redis | null {
  if (redisTried) return redis;
  redisTried = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    redis = new Redis({ url, token });
  }
  return redis;
}

const limiters = new Map<string, Ratelimit>();
function getLimiter(maxHits: number, windowMs: number): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  const cacheKey = `${maxHits}:${windowMs}`;
  let l = limiters.get(cacheKey);
  if (!l) {
    l = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(maxHits, `${Math.max(1, Math.ceil(windowMs / 1000))} s`),
      prefix: "rl",
      analytics: false,
    });
    limiters.set(cacheKey, l);
  }
  return l;
}

export async function rateLimitAsync(
  key: string,
  maxHits: number,
  windowMs: number,
): Promise<RLResult> {
  const l = getLimiter(maxHits, windowMs);
  if (!l) return memoryLimit(key, maxHits, windowMs);
  try {
    const res = await l.limit(key);
    return {
      ok: res.success,
      retryAfter: res.success ? 0 : Math.max(0, res.reset - Date.now()),
    };
  } catch (err) {
    console.error("[rate-limit] Upstash error; falling back to memory", err);
    return memoryLimit(key, maxHits, windowMs);
  }
}

// Backwards-compatible sync call used by existing routes.
// Returns memory-based result synchronously; fire Upstash check async.
export function rateLimit(key: string, maxHits: number, windowMs: number): RLResult {
  return memoryLimit(key, maxHits, windowMs);
}

export function clientKey(req: Request, suffix: string): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return `${suffix}:${ip}`;
}

export function redisEnabled(): boolean {
  return !!getRedis();
}
