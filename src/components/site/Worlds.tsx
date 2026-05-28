"use client";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/lang-context";
import { pick } from "@/lib/bilingual";
import type { WorldsData, WorldCard, Lang } from "@/lib/content-types";

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

function WorldsModal({
  data,
  lang,
  onClose,
}: {
  data: WorldsData;
  lang: Lang;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className="pricing-modal-backdrop" onClick={onClose}>
      <div
        className="worlds-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${pick(data.heading.lead, lang)} ${pick(data.heading.accent, lang)}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="pricing-modal-close"
          onClick={onClose}
          aria-label="Închide"
        >
          ×
        </button>
        <div className="worlds-modal-head">
          <h2>
            {pick(data.heading.lead, lang)}{" "}
            <span>{pick(data.heading.accent, lang)}</span>
          </h2>
          <p>{pick(data.intro, lang)}</p>
        </div>
        <div className="worlds-modal-list">
          {data.worlds.map((w) => (
            <div key={w.id} className={`worlds-modal-item wr-${w.key}`}>
              <div className="w-symbol worlds-modal-symbol">
                <Symbol k={w.key} />
              </div>
              <div className="worlds-modal-info">
                <div className="w-label">{pick(w.label, lang)}</div>
                <h3>{pick(w.title, lang)}</h3>
                <p>{pick(w.body, lang)}</p>
                {w.tags.length > 0 && (
                  <div className="w-tags">
                    {w.tags.map((t, i) => (
                      <span key={i}>{pick(t, lang)}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Worlds({ data }: { data: WorldsData }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <div id="worlds">
      <div className="worlds-intro">
        <h2>
          {pick(data.heading.lead, lang)}
          <br />
          <span>{pick(data.heading.accent, lang)}</span>
        </h2>
        <p>{pick(data.intro, lang)}</p>
        <button className="worlds-cta" onClick={() => setOpen(true)}>
          {lang === "ro" ? "Explorează lumile" : "Explore the worlds"}
          <span aria-hidden> →</span>
        </button>
      </div>
      {open && (
        <WorldsModal data={data} lang={lang} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
