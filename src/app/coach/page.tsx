import Link from "next/link";
import { getSlotsForDate, isoDate } from "@/lib/coach-schedule";

export const dynamic = "force-dynamic";

export default async function CoachHome() {
  const today = new Date();
  const slots = await getSlotsForDate(today);
  const dateStr = isoDate(today);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black uppercase tracking-tight">Sesiuni — azi</h1>
        <p className="opacity-60 mt-2 text-sm capitalize">
          {today.toLocaleDateString("ro-RO", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </header>

      {slots.length === 0 ? (
        <div className="opacity-60 text-sm border border-dashed border-white/15 rounded-lg p-10 text-center">
          Nicio sesiune programată azi.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {slots.map((s) => (
            <Link
              key={s.id}
              href={`/coach/scan/${encodeURIComponent(s.id)}?date=${dateStr}`}
              className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-[var(--sun)] transition block"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest opacity-60">{s.row === "am" ? "Dimineața" : "Seara"}</div>
                  <div className="text-xl font-black mt-1">{s.activity.ro}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {s.time} · {s.world.ro}
                  </div>
                </div>
                <div className="text-xs uppercase tracking-widest font-bold text-[var(--sun)]">
                  Scanează →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
