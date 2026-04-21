import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateQrToken } from "@/lib/qr-token";
import { rateLimitAsync, clientKey } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const rl = await rateLimitAsync(clientKey(req, "qr-rotate"), 5, 300_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Prea multe cereri" }, { status: 429 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const token = generateQrToken();
  await db.update(users).set({ qrToken: token }).where(eq(users.id, session.user.id));
  return NextResponse.json({ ok: true, token });
}
