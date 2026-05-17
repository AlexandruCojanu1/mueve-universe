import { randomBytes } from "crypto";
import { cookies, headers } from "next/headers";
import { db } from "@/db";
import { users, blockedDevices } from "@/db/schema";
import { and, eq } from "drizzle-orm";

// Device binding with permanent lockout on switch.
//
//  - First login on a device → cookie is minted and bound to user
//  - Same device → silent pass
//  - Different device → returns needsSwitch so the UI can ask the user
//    "vrei să muți accesul aici? telefonul vechi va fi blocat definitiv"
//  - Switch confirmed → old deviceId moves to blocked_devices (never
//    accepted again) and new device becomes the bound one
//  - Cookie that appears in blocked_devices for this user → 403 forever

const COOKIE = "mueve_did";
const ONE_YEAR_SEC = 60 * 60 * 24 * 365;

export type CheckResult =
  | { ok: true; firstBind: boolean }
  | { ok: false; reason: "device_mismatch"; needsSwitch: true }
  | { ok: false; reason: "permanently_blocked" };

function newDeviceId(): string {
  return randomBytes(16).toString("hex");
}

async function getClientMeta() {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    null;
  const ua = h.get("user-agent") || null;
  return { ip, ua };
}

async function isBlocked(userId: string, deviceId: string): Promise<boolean> {
  const rows = await db
    .select({ id: blockedDevices.id })
    .from(blockedDevices)
    .where(
      and(eq(blockedDevices.userId, userId), eq(blockedDevices.deviceId, deviceId)),
    )
    .limit(1);
  return rows.length > 0;
}

/** Read-only check, safe for Server Components. */
export async function readDeviceBinding(userId: string): Promise<CheckResult> {
  const jar = await cookies();
  const did = jar.get(COOKIE)?.value;

  if (did && (await isBlocked(userId, did))) {
    return { ok: false, reason: "permanently_blocked" };
  }

  const [user] = await db
    .select({ deviceId: users.deviceId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return { ok: true, firstBind: false };
  if (!user.deviceId) return { ok: true, firstBind: false };
  if (!did || user.deviceId !== did) {
    return { ok: false, reason: "device_mismatch", needsSwitch: true };
  }
  return { ok: true, firstBind: false };
}

/** Mutating version — only for Route Handlers / Server Actions. */
export async function checkAndBindDevice(userId: string): Promise<CheckResult> {
  const jar = await cookies();
  let did = jar.get(COOKIE)?.value;
  const minted = !did;
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

  if (await isBlocked(userId, did)) {
    return { ok: false, reason: "permanently_blocked" };
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
    if (minted) jar.delete(COOKIE);
    return { ok: false, reason: "device_mismatch", needsSwitch: true };
  }

  return { ok: true, firstBind: false };
}

/**
 * Move binding to the current device cookie. The previously-bound deviceId
 * is stored in blocked_devices and will never be accepted again, even if
 * it later presents valid credentials.
 */
export async function switchDeviceToCurrent(userId: string): Promise<{
  ok: boolean;
  blocked?: string;
}> {
  const jar = await cookies();
  let did = jar.get(COOKIE)?.value;
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

  if (await isBlocked(userId, did)) {
    return { ok: false };
  }

  const [user] = await db
    .select({ deviceId: users.deviceId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const oldDeviceId = user?.deviceId ?? null;
  const { ip, ua } = await getClientMeta();

  if (oldDeviceId && oldDeviceId !== did) {
    await db
      .insert(blockedDevices)
      .values({
        userId,
        deviceId: oldDeviceId,
        ipAddress: ip,
        userAgent: ua,
      })
      .onConflictDoNothing();
  }

  await db
    .update(users)
    .set({ deviceId: did, deviceBoundAt: new Date() })
    .where(eq(users.id, userId));

  return { ok: true, blocked: oldDeviceId ?? undefined };
}

/** Admin reset — clears active binding (does NOT un-block past devices). */
export async function unbindDevice(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ deviceId: null, deviceBoundAt: null })
    .where(eq(users.id, userId));
}
