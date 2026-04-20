import { randomBytes } from "crypto";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export function generateQrToken(): string {
  return randomBytes(20).toString("hex");
}

export async function ensureQrToken(userId: string): Promise<string> {
  const rows = await db
    .select({ qrToken: users.qrToken })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const existing = rows[0]?.qrToken;
  if (existing) return existing;
  const token = generateQrToken();
  await db.update(users).set({ qrToken: token }).where(eq(users.id, userId));
  return token;
}
