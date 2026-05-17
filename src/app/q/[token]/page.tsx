import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyDynamicToken } from "@/lib/qr-dynamic";
import { getActivePassRow, getCreditBalance } from "@/lib/credits";

export const dynamic = "force-dynamic";

// Public scan landing.
//
// Anyone (coach, partner, mystery passer-by) who scans a member's QR lands
// here without logging in. We show a big GREEN VALID + the member's name if
// the token is good and the pass is active. Nothing else — no buttons, no
// dashboard links. Pages with sensitive admin actions live behind /coach
// and /partner, those still require auth.
//
// Token forms accepted:
//   - rotating signed dynamic token (HMAC, 60s TTL) — preferred, dies fast
//   - persistent users.qr_token (Apple/Google Wallet pass)

export default async function QLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let memberId: string | null = null;
  const dyn = verifyDynamicToken(token);
  if (dyn) {
    memberId = dyn.userId;
  } else {
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.qrToken, token))
      .limit(1);
    if (rows[0]) memberId = rows[0].id;
  }

  if (!memberId) {
    return (
      <main className="qv-screen qv-screen-bad">
        <div className="qv-card">
          <div className="qv-status">INVALID</div>
          <div className="qv-sub">Cod expirat sau necunoscut.</div>
        </div>
      </main>
    );
  }

  const [memberRows, pass, credits] = await Promise.all([
    db.select().from(users).where(eq(users.id, memberId)).limit(1),
    getActivePassRow(memberId),
    getCreditBalance(memberId),
  ]);
  const member = memberRows[0];
  const isOk = !!pass && credits.total > 0;
  const isWarn = !!pass && credits.total === 0;

  return (
    <main
      className={
        "qv-screen " +
        (isOk ? "qv-screen-ok" : isWarn ? "qv-screen-warn" : "qv-screen-bad")
      }
    >
      <div className="qv-card">
        <div className="qv-status">{isOk ? "VALID" : isWarn ? "FĂRĂ CLASE" : "INACTIV"}</div>
        <div className="qv-name">{member?.name || member?.email || "Membru"}</div>
        {!isOk && (
          <div className="qv-sub">
            {isWarn
              ? "Pass activ, dar fără clase rămase."
              : "Pass-ul nu e activ. Membrul trebuie să cumpere."}
          </div>
        )}
        {isOk && credits.total > 0 && (
          <div className="qv-meta">
            {credits.total} {credits.total === 1 ? "clasă rămasă" : "clase rămase"}
          </div>
        )}
      </div>
    </main>
  );
}
