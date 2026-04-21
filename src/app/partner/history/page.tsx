import { auth } from "@/auth";
import { db } from "@/db";
import { partners, partnerVisits } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import ExportCsvButton from "@/components/partner/ExportCsvButton";

export const dynamic = "force-dynamic";

export default async function PartnerHistoryPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const rows = await db
    .select()
    .from(partners)
    .where(eq(partners.userId, session.user.id))
    .limit(1);
  const p = rows[0];
  if (!p) return null;

  const visits = await db
    .select()
    .from(partnerVisits)
    .where(eq(partnerVisits.partnerId, p.id))
    .orderBy(desc(partnerVisits.createdAt))
    .limit(1000);

  const csvData = visits.map((v) => ({
    createdAt: v.createdAt.toISOString(),
    memberName: v.memberName,
    memberEmail: v.memberEmail,
    valid: v.valid,
    reason: v.reason,
  }));

  return (
    <>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Partener</div>
        <h1 className="dash-page-title">Istoric scanări</h1>
        <p className="dash-page-sub">Ultimele 1000 de validări.</p>
      </header>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <ExportCsvButton visits={csvData} />
      </div>

      <div className="dash-card">
        {visits.length === 0 ? (
          <div className="dash-empty">Nicio scanare încă.</div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Când</th>
                  <th>Membru</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Motiv</th>
                </tr>
              </thead>
              <tbody>
                {visits.slice(0, 200).map((v) => (
                  <tr key={v.id}>
                    <td>{v.createdAt.toLocaleString("ro-RO")}</td>
                    <td>{v.memberName || "—"}</td>
                    <td>{v.memberEmail || "—"}</td>
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
                    </td>
                    <td style={{ opacity: 0.7 }}>{v.reason || "—"}</td>
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
