"use client";
import { useLang } from "@/lib/lang-context";
import { pick } from "@/lib/bilingual";
import type { WorldsData, WorldCard } from "@/lib/content-types";

function Symbol({ k }: { k: WorldCard["key"] }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.5,
  } as const;
  switch (k) {
    case "forge":
      return (
        <svg {...common}>
          <path d="M6 12h12M12 6v12" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
    case "temple":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v4m0 12v4m-10-10h4m12 0h4" />
        </svg>
      );
    case "path":
      return (
        <svg {...common}>
          <path d="M4 19l4-4 4 4 4-4 4 4" />
          <path d="M4 14l4-4 4 4 4-4 4 4" />
        </svg>
      );
    case "sanctuary":
      return (
        <svg {...common}>
          <path d="M12 21a9 9 0 0 0 0-18 9 9 0 0 0 0 18z" />
          <path d="M12 7v5l3 3" />
        </svg>
      );
    case "walk":
      return (
        <svg {...common}>
          <circle cx="13" cy="4" r="2" />
          <path d="M13 22l-3-7 3-2-1-5-4 2-1 3" />
          <path d="M17 13l-2-2 3-4" />
        </svg>
      );
  }
}

export default function Worlds({ data }: { data: WorldsData }) {
  const { lang } = useLang();
  return (
    <div id="worlds">
      <div className="worlds-intro">
        <h2>
          {pick(data.heading.lead, lang)}
          <br />
          <span>{pick(data.heading.accent, lang)}</span>
        </h2>
        <p>{pick(data.intro, lang)}</p>
      </div>
      {data.worlds.map((w) => (
        <div key={w.id} className={`world-row wr-${w.key}`}>
          <div className="world-color">
            <div className="big-icon">{w.bigIcon}</div>
            <div className="w-symbol">
              <Symbol k={w.key} />
            </div>
          </div>
          <div className="world-info">
            <div className="w-label">{pick(w.label, lang)}</div>
            <h3>{pick(w.title, lang)}</h3>
            <p>{pick(w.body, lang)}</p>
            <div className="w-tags">
              {w.tags.map((t, i) => (
                <span key={i}>{pick(t, lang)}</span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
