"use client";
import { useLang } from "@/lib/lang-context";
import { pick } from "@/lib/bilingual";
import type { FooterData, FooterSocial } from "@/lib/content-types";

function SocialIcon({ icon }: { icon: FooterSocial["icon"] }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
  } as const;
  switch (icon) {
    case "instagram":
      return (
        <svg {...common}>
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="5" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <rect x="2" y="5" width="20" height="14" rx="3" />
          <path d="M10 9l6 3-6 3z" fill="currentColor" />
        </svg>
      );
    case "twitter":
      return (
        <svg {...common}>
          <path d="M22 4a13 13 0 0 1-3 1 5 5 0 0 0-9 3v2A11 11 0 0 1 2 5s-4 9 5 13a13 13 0 0 1-7 2c9 5 20 0 20-11v-1A7 7 0 0 0 22 4z" />
        </svg>
      );
  }
}

export default function Footer({ data }: { data: FooterData }) {
  const { lang } = useLang();
  return (
    <footer className="foot">
      <span>{pick(data.copyright, lang)}</span>
      <div className="foot-legal">
        <a href="/terms">
          {lang === "ro" ? "Termeni & cond." : "Terms & cond."}
        </a>
      </div>
      <div className="foot-social">
        {data.socials.map((s) => (
          <a key={s.id} href={s.href} aria-label={s.label}>
            <SocialIcon icon={s.icon} />
          </a>
        ))}
      </div>
    </footer>
  );
}
