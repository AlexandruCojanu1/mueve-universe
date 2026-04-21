import Link from "next/link";
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
    <>
      <Link href="/coach" className="dash-back">
        ← Înapoi la sesiuni
      </Link>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Validare prezență</div>
        <h1 className="dash-page-title">{slot.activity.ro}</h1>
        <p className="dash-page-sub">
          {slot.time} · {slot.world.ro} · {dateStr}
        </p>
      </header>

      <Scanner slotId={slotId} slotDate={dateStr} />
    </>
  );
}
