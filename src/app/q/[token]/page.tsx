import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, partners } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getActivePassRow, getCreditBalance } from "@/lib/credits";
import PartnerVerifyClient from "@/components/partner/PartnerVerifyClient";
import StarfieldBg from "@/components/site/StarfieldBg";

export const dynamic = "force-dynamic";

export default async function QLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?from=${encodeURIComponent(`/q/${token}`)}`);
  }

  const role = session.user.role;
  const memberRows = await db
    .select()
    .from(users)
    .where(eq(users.qrToken, token))
    .limit(1);
  const member = memberRows[0];

  if (role === "partner") {
    return (
      <div className="q-shell">
        <StarfieldBg />
        <div className="q-shell-glow q-shell-glow-sun" aria-hidden />
        <div className="q-shell-glow q-shell-glow-violet" aria-hidden />
        <div className="q-card-wrap">
          <PartnerVerifyClient token={token} memberEmail={member?.email ?? null} />
          <div className="q-foot">
            <Link href="/partner" className="dash-link">
              ← Dashboard partener
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (role === "admin" || role === "coach") {
    if (!member) {
      return (
        <div className="q-shell">
          <StarfieldBg />
          <div className="q-card-wrap">
            <div className="q-card q-card-error">
              <div className="q-card-eyebrow">QR necunoscut</div>
              <div className="q-card-title">Token invalid</div>
              <div className="q-card-body">Nu există niciun membru cu acest QR.</div>
              <Link href={role === "admin" ? "/admin" : "/coach"} className="dash-btn dash-btn-light">
                Înapoi
              </Link>
            </div>
          </div>
        </div>
      );
    }
    const [pass, credits] = await Promise.all([
      getActivePassRow(member.id),
      getCreditBalance(member.id),
    ]);
    return (
      <div className="q-shell">
        <StarfieldBg />
        <div className="q-shell-glow q-shell-glow-sun" aria-hidden />
        <div className="q-card-wrap">
          <div className={`q-card ${pass ? "q-card-ok" : "q-card-warn"}`}>
            <div className="q-card-eyebrow">{role === "admin" ? "Admin view" : "Coach view"}</div>
            <div className="q-card-title">{member.name || member.email}</div>
            <div className="q-card-sub">{member.email}</div>
            <div className="q-stats">
              <div>
                <div className="q-stat-label">Pass</div>
                <div className="q-stat-val">{pass ? "Activ" : "Inactiv"}</div>
              </div>
              <div>
                <div className="q-stat-label">Clase rămase</div>
                <div className="q-stat-val">{credits.total}</div>
              </div>
            </div>
            <Link href="/coach" className="dash-btn dash-btn-primary">
              Deschide scanner coach
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (member && member.id === session.user.id) {
    redirect("/dashboard/card");
  }

  return (
    <div className="q-shell">
      <StarfieldBg />
      <div className="q-card-wrap">
        <div className="q-card q-card-warn">
          <div className="q-card-eyebrow">Acces restricționat</div>
          <div className="q-card-title">Nu poți valida acest QR</div>
          <div className="q-card-body">
            Doar partenerii Mueve sau coach-ii pot valida QR-urile membrilor.
            Dacă ești partener, loghează-te cu contul tău de partener.
          </div>
          <Link href="/dashboard" className="dash-btn dash-btn-light">
            Contul meu
          </Link>
        </div>
      </div>
    </div>
  );
}
