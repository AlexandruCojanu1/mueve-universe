import { auth } from "@/auth";
import { db } from "@/db";
import { attendances } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import ReserveBoard from "@/components/dashboard/ReserveBoard";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const rows = userId
    ? await db
        .select()
        .from(attendances)
        .where(eq(attendances.userId, userId))
        .orderBy(desc(attendances.validatedAt))
        .limit(100)
    : [];

  return (
    <>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Program</div>
        <h1 className="dash-page-title">Rezervă & istoric</h1>
        <p className="dash-page-sub">
          Rezervă-ți loc la sesiuni — se consumă o clasă. Dacă anulezi cu peste
          2h înainte, clasa se întoarce.
        </p>
      </header>

      <ReserveBoard />

      <div className="dash-page-head" style={{ marginTop: "2.5rem" }}>
        <h2 className="dash-page-title" style={{ fontSize: "1.4rem" }}>
          Istoric prezențe
        </h2>
        <p className="dash-page-sub">
          {rows.length} prezențe validate · ultimele 100 vizibile.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="dash-empty">
          Încă nu ai fost marcat la nicio sesiune. Arată cardul tău QR
          coach-ului la intrarea în sesiune.
        </div>
      ) : (
        <div className="dash-table-wrap">
          <div className="dash-table-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Slot</th>
                  <th>Validat la</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.slotId}-${r.slotDate}`}>
                    <td>{r.slotDate}</td>
                    <td className="dash-table-muted">{r.slotId.slice(0, 8)}…</td>
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
