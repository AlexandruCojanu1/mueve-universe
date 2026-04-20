"use client";
import { useMemo, useState } from "react";
import { useLang } from "@/lib/lang-context";
import { pick } from "@/lib/bilingual";
import type { ProgramData, ProgramSlot } from "@/lib/content-types";

const DOT_COLOR: Record<ProgramSlot["color"], { bg: string; glow: string }> = {
  yellow: { bg: "var(--sun)", glow: "var(--sun-g)" },
  purple: { bg: "var(--temple)", glow: "rgba(168,85,247,.4)" },
  blue: { bg: "var(--forge)", glow: "rgba(59,130,246,.4)" },
  orange: { bg: "var(--sanctuary)", glow: "rgba(245,158,11,.4)" },
};

export default function Program({ data }: { data: ProgramData }) {
  const { lang } = useLang();
  const [open, setOpen] = useState<ProgramSlot | null>(null);

  const grid = useMemo(() => {
    const rows: Record<"am" | "pm", (ProgramSlot | null)[]> = {
      am: Array(7).fill(null),
      pm: Array(7).fill(null),
    };
    for (const s of data.slots) {
      if (s.row !== "am" && s.row !== "pm") continue;
      if (s.day >= 0 && s.day < 7) rows[s.row][s.day] = s;
    }
    return rows;
  }, [data.slots]);

  const rowKeys: ("am" | "pm")[] = ["am", "pm"];
  const icons: Record<"am" | "pm", string> = {
    am: "☀",
    pm: "☾",
  };

  return (
    <section className="prog" id="prog">
      <div className="prog-head">
        <h2>
          {pick(data.heading.lead, lang)}
          <br />
          <span>{pick(data.heading.accent, lang)}</span>
        </h2>
        <p>{pick(data.intro, lang)}</p>
      </div>
      <div className="prog-table">
        <div className="pt-corner" />
        {data.dayLabels.map((d, i) => (
          <div key={i} className={"pt-head" + (i === 6 ? " pt-head-boss" : "")}>
            {pick(d, lang)}
          </div>
        ))}
        {rowKeys.map((rowKey) => (
          <RowBlock
            key={rowKey}
            label={pick(data.rowLabels[rowKey], lang)}
            icon={icons[rowKey]}
            rowKey={rowKey}
            slots={grid[rowKey]}
            lang={lang}
            onOpen={setOpen}
          />
        ))}
      </div>

      <div className={"day-expand" + (open ? " on" : "")}>
        <div className="day-expand-bg" onClick={() => setOpen(null)} />
        {open && (
          <div className="day-expand-inner">
            <button className="dx-close" onClick={() => setOpen(null)} aria-label="Close">
              &times;
            </button>
            <div className="dx-day">{pick(data.dayLabels[open.day], lang)}</div>
            <h3>{pick(open.activity, lang)}</h3>
            <div className="dx-time">{open.time}</div>
            <div className="dx-world">{pick(open.world, lang)}</div>
            {open.description && <p>{pick(open.description, lang)}</p>}
            <button className="btn-join">{pick(data.joinLabel, lang)}</button>
          </div>
        )}
      </div>
    </section>
  );
}

function RowBlock({
  label,
  icon,
  rowKey,
  slots,
  lang,
  onOpen,
}: {
  label: string;
  icon: string;
  rowKey: "am" | "pm";
  slots: (ProgramSlot | null)[];
  lang: ReturnType<typeof useLang>["lang"];
  onOpen: (s: ProgramSlot) => void;
}) {
  return (
    <>
      <div className="pt-label">
        <span>{label}</span>
        <span className="pt-label-icon">{icon}</span>
      </div>
      {slots.map((s, i) => {
        if (!s) {
          void rowKey;
          return <div key={i} className="pt-cell pt-empty" />;
        }
        const dot = DOT_COLOR[s.color];
        return (
          <div
            key={s.id}
            className={"pt-cell pt-has" + (s.boss ? " pt-boss-cell" : "")}
            data-c={s.color}
            onClick={() => onOpen(s)}
          >
            <div
              className="pt-dot"
              style={{ background: dot.bg, boxShadow: `0 0 12px ${dot.glow}` }}
            />
            <div className="pt-act" style={s.boss ? { color: "var(--sun)" } : undefined}>
              {pick(s.activity, lang)}
            </div>
            <div className="pt-time">{s.time}</div>
            <div className="pt-world">{pick(s.world, lang)}</div>
            {s.boss && <div className="pt-badge">MAIN EVENT</div>}
          </div>
        );
      })}
    </>
  );
}
