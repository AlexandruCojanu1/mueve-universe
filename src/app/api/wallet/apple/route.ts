import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { appleWalletEnabled, buildApplePass } from "@/lib/wallet/apple";
import { ensureQrToken } from "@/lib/qr-token";
import { getUserStats } from "@/lib/leaderboard";
import { getCreditBalance } from "@/lib/credits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ redirect: "/login?from=/dashboard/wallet" }, { status: 401 });
  }

  if (!appleWalletEnabled()) {
    return NextResponse.json(
      {
        error:
          "Apple Wallet nu e configurat. Setează APPLE_PASS_TYPE_ID, APPLE_TEAM_ID, APPLE_PASS_CERT_BASE64, APPLE_PASS_CERT_PASSWORD, APPLE_WWDR_BASE64 în .env.local.",
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

  const [stats, credits] = await Promise.all([
    getUserStats(user.id).catch(() => null),
    getCreditBalance(user.id).catch(() => ({ total: 0 })),
  ]);
  const memberSince = user.createdAt
    ? user.createdAt
        .toLocaleDateString("ro-RO", { month: "short", year: "numeric" })
        .toUpperCase()
    : null;

  try {
    const buf = await buildApplePass({
      userId: user.id,
      name: user.name,
      email: user.email,
      qrToken,
      qrUrl,
      planName: sub?.planName ?? null,
      streakWeeks: stats?.currentStreak,
      creditsRemaining: credits.total,
      xp: stats?.xp,
      tier: stats?.tier.name,
      memberSince: memberSince ?? undefined,
    });
    // Remember the card was added so the wallet buttons stay hidden.
    await db
      .update(users)
      .set({ walletAddedAt: new Date() })
      .where(eq(users.id, user.id));
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="mueve-universe-${user.id}.pkpass"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pass generation failed" },
      { status: 500 },
    );
  }
}
