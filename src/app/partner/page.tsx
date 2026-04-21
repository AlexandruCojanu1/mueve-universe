import { auth } from "@/auth";
import Link from "next/link";
import { db } from "@/db";
import { partners, partnerVisits } from "@/db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function PartnerHome() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const rows = await db
    .select()
    .from(partners)
    .where(eq(partners.userId, session.user.id))
    .limit(1);
  const p = rows[0];

  if (!p) {
    return (
      <>
        <header className="dash-page-head">
          <div className="dash-page-eyebrow">Partener</div>
          <h1 className="dash-page-title">Cont nepregătit</h1>
          <p className="dash-page-sub">
            Contul tău de partener nu are încă profil configurat. Contactează
            echipa Mueve.
          </p>
        </header>
      </>
    );
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [monthAgg, totalAgg, recent] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        valid: sql<number>`sum(case when ${partnerVisits.valid} then 1 else 0 end)::int`,
      })
      .from(partnerVisits)
      .where(
        and(
          eq(partnerVisits.partnerId, p.id),
          gte(partnerVisits.createdAt, monthStart),
        ),
      ),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(partnerVisits)
      .where(eq(partnerVisits.partnerId, p.id)),
    db
      .select()
      .from(partnerVisits)
      .where(eq(partnerVisits.partnerId, p.id))
      .orderBy(desc(partnerVisits.createdAt))
      .limit(12),
  ]);

  const month = monthAgg[0] ?? { total: 0, valid: 0 };
  const total = totalAgg[0]?.total ?? 0;

  return (
    <>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Partener Mueve</div>
        <h1 className="dash-page-title">{p.companyName}</h1>
        <p className="dash-page-sub">
          Reducerea ta pentru membrii Mueve:{" "}
          <strong>{p.discountPercent}%</strong>
          {p.discountDescription ? ` · ${p.discountDescription}` : ""}.
        </p>
      </header>

      <div className="dash-grid-3">
        <div className="dash-stat">
          <div className="dash-stat-label">Scanări luna asta</div>
          <div className="dash-stat-val">{month.total ?? 0}</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-label">Valide luna asta</div>
          <div className="dash-stat-val">{month.valid ?? 0}</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-label">Total scanări</div>
          <div className="dash-stat-val">{total}</div>
        </div>
      </div>

      <div className="dash-card" style={{ marginTop: "1.5rem" }}>
        <div className="dash-card-head">
          <div>
            <div className="dash-card-eyebrow">Cum folosești</div>
            <div className="dash-card-title">Scanează QR-ul membrului</div>
          </div>
          <Link href="/partner/scan" className="dash-btn dash-btn-primary">
            Deschide scanner
          </Link>
        </div>
        <p className="dash-card-body">
          Când un membru vine cu telefonul, îi scanezi QR-ul direct de pe card.
          Poți folosi camera ta prin pagina <em>Scanează</em>, sau membrul își
          deschide QR-ul cu telefonul — îl redirecționează automat la pagina de
          validare, unde tu vezi dacă Pass-ul e valid.
        </p>
      </div>

      <div className="dash-card" style={{ marginTop: "1.5rem" }}>
        <div className="dash-card-head">
          <div>
            <div className="dash-card-eyebrow">Recente</div>
            <div className="dash-card-title">Ultimele scanări</div>
          </div>
          <Link href="/partner/history" className="dash-link">
            Vezi tot →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="dash-empty">Nicio scanare încă.</div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Când</th>
                  <th>Membru</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((v) => (
                  <tr key={v.id}>
                    <td>{v.createdAt.toLocaleString("ro-RO")}</td>
                    <td>{v.memberName || v.memberEmail || "—"}</td>
                    <td>
                      {v.valid ? (
                        <span style={{ color: "#4cea9e", fontWeight: 700 }}>
                          Valid
                        </span>
                      ) : (
                        <span style={{ color: "#ff8080", fontWeight: 700 }}>
                          Refuzat
                        </span>
                      )}
                      {v.reason && (
                        <span style={{ opacity: 0.55, marginLeft: 8 }}>
                          · {v.reason}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
