import DashboardTabBar from "@/components/dashboard/DashboardTabBar";

type WorldColor = "yellow" | "purple" | "blue" | "orange";

export type ProgramViewData = {
  days: {
    key: string;
    label: string;
    sub: string;
    sessions: {
      id: string;
      time: string;
      activity: string;
      world: string;
      color: WorldColor;
      isNext: boolean;
    }[];
  }[];
};

export default function ProgramView({ data }: { data: ProgramViewData }) {
  return (
    <>
      <header className="m-hello">
        <div>
          <div className="m-hello-eyebrow">PROGRAM</div>
          <h1 className="m-hello-name">Săptămâna ta</h1>
        </div>
      </header>

      {data.days.length === 0 && (
        <div className="m-empty">Niciun antrenament în următoarele 7 zile.</div>
      )}

      {data.days.map((day) => (
        <section className="m-day" key={day.key}>
          <div className="m-day-head">
            <span className="m-day-label">{day.label}</span>
            <span className="m-day-sub">{day.sub}</span>
          </div>
          <div className="m-day-slots">
            {day.sessions.map((s) => (
              <div className="m-slot" data-c={s.color} key={s.id}>
                <span className="m-slot-time">{s.time}</span>
                <span className="m-slot-main">
                  <span className="m-slot-act">{s.activity}</span>
                  <span className="m-slot-world">
                    <span className="m-slot-dot" />
                    {s.world}
                  </span>
                </span>
                {s.isNext && <span className="m-slot-next">URMĂTOAREA</span>}
              </div>
            ))}
          </div>
        </section>
      ))}

      <a className="m-fullprog-link" href="/#prog">
        Vezi programul complet pe site →
      </a>

      <DashboardTabBar active="program" />
    </>
  );
}
