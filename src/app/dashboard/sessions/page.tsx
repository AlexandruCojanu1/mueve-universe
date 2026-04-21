import { auth } from "@/auth";
import { db } from "@/db";
import { attendances } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getProgramData } from "@/lib/coach-schedule";

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
  const program = await getProgramData();
  const slotMap = new Map<
    string,
    (typeof program extends null ? never : NonNullable<typeof program>)["slots"][number]
  >();
  program?.slots.forEach((s) => slotMap.set(s.id, s));

  return (
    <>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Istoric</div>
        <h1 className="dash-page-title">Sesiunile mele</h1>
        <p className="dash-page-sub">
          {rows.length} prezențe validate · ultimele 100 vizibile.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="dash-empty">
          Încă nu ai fost marcat la nicio sesiune. Arată cardul tău QR coach-ului la
          intrarea în sesiune.
        </div>
      ) : (
        <div className="dash-table-wrap">
          <div className="dash-table-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Activitate</th>
                  <th>Lume</th>
                  <th>Validat la</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const slot = slotMap.get(r.slotId);
                  return (
                    <tr key={`${r.slotId}-${r.slotDate}`}>
                      <td>{r.slotDate}</td>
                      <td>
                        <span className="dash-table-strong">
                          {slot?.activity.ro || r.slotId}
                        </span>
                      </td>
                      <td className="dash-table-muted">{slot?.world.ro || "—"}</td>
                      <td className="dash-table-muted">
                        {r.validatedAt.toLocaleString("ro-RO")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
