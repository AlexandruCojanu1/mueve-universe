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
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black uppercase tracking-tight">Istoric prezențe</h1>
        <p className="opacity-60 mt-2 text-sm">Ultimele 100 validări.</p>
      </header>
      {rows.length === 0 ? (
        <div className="opacity-60 text-sm border border-dashed border-white/15 rounded-lg p-10 text-center">
          Niciun utilizator marcat încă.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left opacity-60 uppercase text-[10px] tracking-widest">
                <th className="py-2 pr-4">Utilizator</th>
                <th className="py-2 pr-4">Data</th>
                <th className="py-2 pr-4">Slot</th>
                <th className="py-2 pr-4">Metodă</th>
                <th className="py-2">Validat la</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={`${r.userId}-${r.slotId}-${r.slotDate}`}
                  className="border-t border-white/5"
                >
                  <td className="py-2 pr-4">
                    <span className="font-bold">{r.name || r.email}</span>
                    {r.name && <span className="opacity-50 ml-2 text-xs">{r.email}</span>}
                  </td>
                  <td className="py-2 pr-4">{r.slotDate}</td>
                  <td className="py-2 pr-4 opacity-70">{r.slotId}</td>
                  <td className="py-2 pr-4 text-xs uppercase tracking-widest opacity-60">{r.method}</td>
                  <td className="py-2 opacity-70">{r.validatedAt.toLocaleString("ro-RO")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
