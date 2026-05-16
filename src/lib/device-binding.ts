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
 * Reads or sets the device cookie, then enforces the binding against the
 * user row. Returns `ok: false` only when the cookie is present but doesn't
 * match what's stored on the user.
 *
 * Call this on every server action that issues a dynamic QR token (and on
 * the dashboard render).
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
    // If the caller had no cookie at all, we still wrote a fresh one above.
    // Don't auto-overwrite the stored binding — that would defeat the point.
    if (newCookieValue) {
      // Roll the cookie back so we don't sit on a phantom did the user can't use.
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
