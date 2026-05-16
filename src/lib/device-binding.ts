import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Lightweight device binding: the first device that ever requests a dynamic
// QR token gets its UUID cookie stored on the user row. Subsequent requests
// from a different cookie are refused unless an admin resets the binding.
//
// This stops account sharing — Bob can't just log in with Alice's password
// on his own phone, because his cookie won't match Alice's bound device.
// (The rotating 60-second QR token already stops QR-screenshot sharing.)

const COOKIE = "mueve_did";
const ONE_YEAR_SEC = 60 * 60 * 24 * 365;

type CheckResult =
  | { ok: true; firstBind: boolean }
  | { ok: false; reason: "device_mismatch" };

function newDeviceId(): string {
  return randomBytes(16).toString("hex");
}

/**
 * READ-ONLY device check, safe for Server Components (pages).
 *
 * Does NOT write cookies — Server Components in Next.js cannot mutate
 * cookies. Returns ok:true with firstBind=false if the user has no cookie
 * yet (the bind will happen on their first /api/qr/dynamic call, which is
 * a Route Handler and can write).
 */
export async function readDeviceBinding(userId: string): Promise<CheckResult> {
  const jar = await cookies();
  const did = jar.get(COOKIE)?.value;
  const [user] = await db
    .select({ deviceId: users.deviceId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return { ok: true, firstBind: false };
  // Bind hasn't happened yet (no cookie OR no DB record). API will set it.
  if (!user.deviceId) return { ok: true, firstBind: false };
  // We have a stored binding but the browser cookie doesn't match.
  if (!did || user.deviceId !== did) return { ok: false, reason: "device_mismatch" };
  return { ok: true, firstBind: false };
}

/**
 * Mutating version — only call from a Route Handler or Server Action.
 * Mints the cookie if missing, binds it to the user on first call.
 */
export async function checkAndBindDevice(userId: string): Promise<CheckResult> {
  const jar = await cookies();
  let did = jar.get(COOKIE)?.value;
  const newCookieValue = !did;
  if (!did) {
    did = newDeviceId();
    jar.set(COOKIE, did, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ONE_YEAR_SEC,
    });
  }

  const [user] = await db
    .select({ deviceId: users.deviceId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return { ok: true, firstBind: false };

  if (!user.deviceId) {
    await db
      .update(users)
      .set({ deviceId: did, deviceBoundAt: new Date() })
      .where(eq(users.id, userId));
    return { ok: true, firstBind: true };
  }

  if (user.deviceId !== did) {
    if (newCookieValue) {
      jar.delete(COOKIE);
    }
    return { ok: false, reason: "device_mismatch" };
  }

  return { ok: true, firstBind: false };
}

/** Admin reset — clears the binding so the user can re-bind on next visit. */
export async function unbindDevice(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ deviceId: null, deviceBoundAt: null })
    .where(eq(users.id, userId));
}
