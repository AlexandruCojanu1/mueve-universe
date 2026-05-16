import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.QR_DYNAMIC_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";

if (!SECRET) {
  // Don't crash at import time — only when used.
  console.warn("[qr-dynamic] No secret available. Set QR_DYNAMIC_SECRET or AUTH_SECRET.");
}

// Token shape: <userId>.<expSec>.<base64url-sig>
//
// The persistent `qr_token` column still exists for Apple/Google wallet passes
// (they bake a static URL into the pass). The DYNAMIC token rotates every ~30s
// on the dashboard so a screenshot becomes useless in under a minute.

const TTL_SECONDS = 60;

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function issueDynamicToken(userId: string): { token: string; expiresAt: number } {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = `${userId}.${exp}`;
  const sig = sign(payload);
  return { token: `${payload}.${sig}`, expiresAt: exp * 1000 };
}

export function verifyDynamicToken(token: string): { userId: string } | null {
  if (!token || !token.includes(".")) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expStr, sig] = parts;
  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp)) return null;
  if (Date.now() / 1000 > exp) return null;
  const expected = sign(`${userId}.${exp}`);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return { userId };
}

export const DYNAMIC_TTL_MS = TTL_SECONDS * 1000;
