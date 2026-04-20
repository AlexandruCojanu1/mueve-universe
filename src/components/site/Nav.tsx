"use client";
import { useState } from "react";
import { useLang } from "@/lib/lang-context";
import { pick } from "@/lib/bilingual";
import type { NavData } from "@/lib/content-types";

export default function Nav({ data }: { data: NavData }) {
  const { lang, toggle } = useLang();
  const [mob, setMob] = useState(false);

  return (
    <>
      <nav className="nav">
        <a href="#" className="nav-logo">
          {data.logo}
        </a>
        <div className="nav-r">
          {data.links.map((l, i) => (
            <a key={i} href={l.href}>
              {pick(l.label, lang)}
            </a>
          ))}
          <button className="lang-sw" onClick={toggle}>
            {lang === "ro" ? "EN" : "RO"}
          </button>
        </div>
        <button
          className={"ham" + (mob ? " on" : "")}
          aria-label="Menu"
          onClick={() => setMob((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>
      <div className={"mob" + (mob ? " on" : "")}>
        {data.links.map((l, i) => (
          <a key={i} href={l.href} onClick={() => setMob(false)}>
            {pick(l.label, lang)}
          </a>
        ))}
      </div>
    </>
  );
}
