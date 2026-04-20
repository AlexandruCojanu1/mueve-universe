import { redirect } from "next/navigation";
import { getSlotsForDate, isoDate } from "@/lib/coach-schedule";
import Scanner from "@/components/coach/Scanner";

export const dynamic = "force-dynamic";

export default async function ScanPage({
  params,
  searchParams,
}: {
  params: Promise<{ slotId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { slotId } = await params;
  const sp = await searchParams;
  const today = new Date();
  const dateStr = sp.date || isoDate(today);
  const slots = await getSlotsForDate(today);
  const slot = slots.find((s) => s.id === slotId);
  if (!slot) redirect("/coach");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <a href="/coach" className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100">
          ← Înapoi la sesiuni
        </a>
        <h1 className="text-3xl font-black uppercase tracking-tight">{slot.activity.ro}</h1>
        <div className="text-sm opacity-70">
          {slot.time} · {slot.world.ro} · {dateStr}
        </div>
      </header>

      <Scanner slotId={slotId} slotDate={dateStr} />
    </div>
  );
}
