import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { googleWalletEnabled, buildGoogleSaveUrl } from "@/lib/wallet/google";
import { ensureQrToken } from "@/lib/qr-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ redirect: "/login?from=/dashboard/wallet" }, { status: 401 });
  }

  if (!googleWalletEnabled()) {
    return NextResponse.json(
      {
        error:
          "Google Wallet nu e configurat. Setează GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_CLASS_ID, GOOGLE_WALLET_SERVICE_ACCOUNT_JSON în .env.local.",
      },
      { status: 503 },
    );
  }

  const userRows = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  const user = userRows[0];
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const qrToken = await ensureQrToken(user.id);
  const sub = (
    await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .orderBy(desc(subscriptions.updatedAt))
      .limit(1)
  )[0];

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "";
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const origin = process.env.NEXTAUTH_URL || (host ? `${proto}://${host}` : "");
  const qrUrl = origin ? `${origin}/q/${qrToken}` : null;

  try {
    const saveUrl = await buildGoogleSaveUrl({
      userId: user.id,
      name: user.name,
      email: user.email,
      qrToken,
      qrUrl,
      planName: sub?.planName ?? null,
    });
    return NextResponse.json({ saveUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Save URL generation failed" },
      { status: 500 },
    );
  }
}
