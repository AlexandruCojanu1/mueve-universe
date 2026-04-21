import Link from "next/link";
import { getSlotsForDate, isoDate } from "@/lib/coach-schedule";

export const dynamic = "force-dynamic";

export default async function CoachHome() {
  const today = new Date();
  const slots = await getSlotsForDate(today);
  const dateStr = isoDate(today);

  const dayLabel = today.toLocaleDateString("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Coach</div>
        <h1 className="dash-page-title">Sesiuni — azi</h1>
        <p
          className="dash-page-sub"
          style={{ textTransform: "capitalize" }}
        >
          {dayLabel}
        </p>
      </header>

      {slots.length === 0 ? (
        <div className="dash-empty">Nicio sesiune programată azi.</div>
      ) : (
        <div className="dash-grid-2">
          {slots.map((s) => (
            <Link
              key={s.id}
              href={`/coach/scan/${encodeURIComponent(s.id)}?date=${dateStr}`}
              className="dash-card dash-card-hover"
              style={{ textDecoration: "none" }}
            >
              <div className="dash-card-label">
                {s.row === "am" ? "Dimineața" : "Seara"}
              </div>
              <div className="dash-card-value" style={{ fontSize: "1.15rem" }}>
                {s.activity.ro}
              </div>
              <div className="dash-card-meta">
                {s.time} · {s.world.ro}
              </div>
              <div
                className="dash-link"
                style={{ marginTop: "0.5rem" }}
              >
                Scanează →
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
