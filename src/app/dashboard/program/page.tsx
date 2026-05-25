import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ProgramView, {
  type ProgramViewData,
} from "@/components/dashboard/ProgramView";
import { getProgramData } from "@/lib/coach-schedule";
import { upcomingSessions } from "@/lib/user-stats";
import { isoDate } from "@/lib/coach-schedule";

export const dynamic = "force-dynamic";

function slotDateTime(dateStr: string, time: string): Date {
  const [h, m] = time.split(":").map((n) => parseInt(n, 10) || 0);
  const dt = new Date(`${dateStr}T00:00:00`);
  dt.setHours(h, m, 0, 0);
  return dt;
}

export default async function ProgramPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?from=/dashboard/program");

  const program = await getProgramData().catch(() => null);
  const upcoming = program ? upcomingSessions(program, 7) : [];

  const now = new Date();
  const todayIso = isoDate(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowIso = isoDate(tomorrow);

  const nextUp = upcoming.find((u) => slotDateTime(u.date, u.slot.time) >= now) ?? null;
  const nextKey = nextUp ? `${nextUp.date}-${nextUp.slot.id}` : null;

  // Group sessions by date, preserving chronological order.
  const byDate = new Map<string, ProgramViewData["days"][number]>();
  for (const u of upcoming) {
    let bucket = byDate.get(u.date);
    if (!bucket) {
      const label =
        u.date === todayIso
          ? "AZI"
          : u.date === tomorrowIso
            ? "MÂINE"
            : (u.dayLabel || "").toUpperCase();
      bucket = {
        key: u.date,
        label,
        sub: u.date.slice(5).replace("-", "."),
        sessions: [],
      };
      byDate.set(u.date, bucket);
    }
    const id = `${u.date}-${u.slot.id}`;
    bucket.sessions.push({
      id,
      time: u.slot.time,
      activity: u.slot.activity.ro,
      world: u.slot.world.ro,
      color: u.slot.color,
      isNext: id === nextKey,
    });
  }

  const data: ProgramViewData = { days: [...byDate.values()] };
  return <ProgramView data={data} />;
}
