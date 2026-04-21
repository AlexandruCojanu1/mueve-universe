import { db } from "@/db";
import { attendances, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function CoachHistory() {
  const rows = await db
    .select({
      userId: attendances.userId,
      slotId: attendances.slotId,
      slotDate: attendances.slotDate,
      method: attendances.method,
      validatedAt: attendances.validatedAt,
      name: users.name,
      email: users.email,
    })
    .from(attendances)
    .innerJoin(users, eq(users.id, attendances.userId))
    .orderBy(desc(attendances.validatedAt))
    .limit(100);

  return (
    <>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Coach</div>
        <h1 className="dash-page-title">Istoric prezențe</h1>
        <p className="dash-page-sub">Ultimele 100 validări.</p>
      </header>

      {rows.length === 0 ? (
        <div className="dash-empty">Niciun utilizator marcat încă.</div>
      ) : (
        <div className="dash-table-wrap">
          <div className="dash-table-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Utilizator</th>
                  <th>Data</th>
                  <th>Slot</th>
                  <th>Metodă</th>
                  <th>Validat la</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.userId}-${r.slotId}-${r.slotDate}`}>
                    <td>
                      <span className="dash-table-strong">{r.name || r.email}</span>
                      {r.name && (
                        <span
                          className="dash-table-muted"
                          style={{ marginLeft: "0.6rem", fontSize: "0.72rem" }}
                        >
                          {r.email}
                        </span>
                      )}
                    </td>
                    <td>{r.slotDate}</td>
                    <td className="dash-table-muted">{r.slotId}</td>
                    <td>
                      <span className="dash-table-pill">{r.method}</span>
                    </td>
                    <td className="dash-table-muted">
                      {r.validatedAt.toLocaleString("ro-RO")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
