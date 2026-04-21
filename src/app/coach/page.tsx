import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { classSlots } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { isoDate } from "@/lib/coach-schedule";

export const dynamic = "force-dynamic";

const DAYS = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"];

export default async function CoachHome() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const today = new Date();
  const jsDay = today.getDay();
  const dayOfWeek = jsDay === 0 ? 7 : jsDay;
  const dateStr = isoDate(today);
  const dayLabel = today.toLocaleDateString("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const whereCoach =
    session.user.role === "admin"
      ? undefined
      : eq(classSlots.coachId, session.user.id);
  const slots = await db
    .select()
    .from(classSlots)
    .where(
      whereCoach
        ? and(eq(classSlots.dayOfWeek, dayOfWeek), eq(classSlots.active, true), whereCoach)
        : and(eq(classSlots.dayOfWeek, dayOfWeek), eq(classSlots.active, true)),
    )
    .orderBy(asc(classSlots.startTime));

  return (
    <>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Coach</div>
        <h1 className="dash-page-title">Sesiuni — azi</h1>
        <p className="dash-page-sub" style={{ textTransform: "capitalize" }}>
          {dayLabel}
        </p>
      </header>

      {slots.length === 0 ? (
        <div className="dash-empty">
          Nicio sesiune programată azi ({DAYS[dayOfWeek - 1]}).
        </div>
      ) : (
        <div className="dash-grid-2">
          {slots.map((s) => (
            <Link
              key={s.id}
              href={`/coach/scan/${encodeURIComponent(s.id)}?date=${dateStr}`}
              className="dash-card dash-card-hover"
              style={{ textDecoration: "none" }}
            >
              <div className="dash-card-label">{s.startTime.slice(0, 5)}</div>
              <div className="dash-card-value" style={{ fontSize: "1.15rem" }}>
                {s.classType || "Clasă"}
              </div>
              <div className="dash-card-meta">
                {s.durationMin}' · cap. {s.capacity}
              </div>
              <div className="dash-link" style={{ marginTop: "0.5rem" }}>
                Scanează →
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
