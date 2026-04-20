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
  const slotMap = new Map<string, (typeof program extends null ? never : NonNullable<typeof program>)["slots"][number]>();
  program?.slots.forEach((s) => slotMap.set(s.id, s));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black uppercase tracking-tight">Sesiunile mele</h1>
        <p className="opacity-60 mt-2 text-sm">
          {rows.length} prezențe validate · ultimele 100 vizibile.
        </p>
      </header>
      {rows.length === 0 ? (
        <div className="opacity-60 text-sm border border-dashed border-white/15 rounded-lg p-10 text-center">
          Încă nu ai fost marcat la nicio sesiune. Arată cardul tău QR coach-ului la intrare.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left opacity-60 uppercase text-[10px] tracking-widest">
                <th className="py-2 pr-4">Data</th>
                <th className="py-2 pr-4">Activitate</th>
                <th className="py-2 pr-4">Lume</th>
                <th className="py-2">Validat la</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const slot = slotMap.get(r.slotId);
                return (
                  <tr key={`${r.slotId}-${r.slotDate}`} className="border-t border-white/5">
                    <td className="py-2 pr-4">{r.slotDate}</td>
                    <td className="py-2 pr-4">
                      <span className="font-bold">{slot?.activity.ro || r.slotId}</span>
                    </td>
                    <td className="py-2 pr-4 opacity-70">{slot?.world.ro || "—"}</td>
                    <td className="py-2 opacity-70">{r.validatedAt.toLocaleString("ro-RO")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
