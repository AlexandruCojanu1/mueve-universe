import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { attendances, classSlots, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { consumeOldestCredit, getCreditBalance } from "@/lib/credits";
import { XP_PER_ATTENDANCE } from "@/lib/leaderboard";
import { awardAttendance } from "@/lib/xp";

export const dynamic = "force-dynamic";

// NFC landing page. The physical NFC sticker at the meetup spot stores a URL
// like https://mueve.ro/checkin/<slotId>. Tapping a phone on the sticker opens
// this page in the browser, we auth-gate it, mark attendance for today and
// award XP. No app or scanner needed.

type Params = { slotId: string };

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function CheckinPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slotId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?from=${encodeURIComponent(`/checkin/${slotId}`)}`);
  }
  const userId = session.user.id;
  const slotDate = todayISO();

  const [slot] = await db
    .select()
    .from(classSlots)
    .where(eq(classSlots.id, slotId))
    .limit(1);

  if (!slot) {
    return (
      <main className="checkin-page">
        <div className="checkin-card checkin-card-err">
          <div className="checkin-eyebrow">NFC Check-In</div>
          <h1>Sesiune necunoscută</h1>
          <p>Sticker-ul ăsta nu mai e mapat la nicio sesiune. Sună un coach.</p>
        </div>
      </main>
    );
  }

  const existing = await db
    .select()
    .from(attendances)
    .where(
      and(
        eq(attendances.userId, userId),
        eq(attendances.slotId, slotId),
        eq(attendances.slotDate, slotDate),
      ),
    )
    .limit(1);

  let status: "already" | "logged" | "no_credit" = "already";
  if (existing.length === 0) {
    const res = await consumeOldestCredit({ userId, slotId, slotDate });
    if (!res.consumed) {
      status = "no_credit";
    } else {
      await db.insert(attendances).values({
        userId,
        slotId,
        slotDate,
        method: "qr",
        validatedBy: userId,
        notes: `nfc:${res.creditId}`,
      });
      await db
        .update(users)
        .set({ lastScanAt: new Date() })
        .where(eq(users.id, userId));
      // Award XP via the ledger (idempotent; computes the streak multiplier and
      // reconciles session/streak milestones).
      await awardAttendance(userId, slotId, slotDate);
      status = "logged";
    }
  }

  const balance = await getCreditBalance(userId);

  return (
    <main className="checkin-page">
      <div
        className={
          "checkin-card " +
          (status === "logged"
            ? "checkin-card-ok"
            : status === "no_credit"
              ? "checkin-card-err"
              : "checkin-card-info")
        }
      >
        <div className="checkin-eyebrow">NFC Check-In</div>
        {status === "logged" && (
          <>
            <h1>+{XP_PER_ATTENDANCE} XP</h1>
            <p className="checkin-sub">
              Prezență înregistrată pentru {slot.classType || "sesiune"}.
            </p>
          </>
        )}
        {status === "already" && (
          <>
            <h1>Deja înăuntru</h1>
            <p className="checkin-sub">
              Te-ai înregistrat deja la sesiunea asta azi.
            </p>
          </>
        )}
        {status === "no_credit" && (
          <>
            <h1>Fără clase rămase</h1>
            <p className="checkin-sub">
              Cumpără un pachet sau cere coach-ului să te marcheze manual.
            </p>
          </>
        )}
        <div className="checkin-meta">
          <span>{slot.classType || "Mueve"}</span>
          <span>·</span>
          <span>{slotDate}</span>
          <span>·</span>
          <span>{balance.total} clase rămase</span>
        </div>
        <div className="checkin-actions">
          <a className="checkin-btn" href="/dashboard/leaderboard">
            Vezi clasamentul →
          </a>
          <a className="checkin-link" href="/dashboard">
            Acasă
          </a>
        </div>
      </div>
    </main>
  );
}
