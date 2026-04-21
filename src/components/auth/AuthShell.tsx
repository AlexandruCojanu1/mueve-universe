"use client";
import Link from "next/link";
import StarfieldBg from "@/components/site/StarfieldBg";

type Bullet = { title: string; desc: string };

export default function AuthShell({
  children,
  eyebrow,
  headline,
  headlineAccent,
  sub,
  bullets,
}: {
  children: React.ReactNode;
  eyebrow: string;
  headline: string;
  headlineAccent?: string;
  sub?: string;
  bullets?: Bullet[];
}) {
  return (
    <div className="auth-shell">
      <StarfieldBg />
      <div className="auth-shell-glow auth-shell-glow-sun" aria-hidden />
      <div className="auth-shell-glow auth-shell-glow-violet" aria-hidden />

      <div className="auth-shell-container">
        <aside className="auth-shell-brand">
          <div className="auth-shell-brand-top">
            <Link href="/" className="auth-shell-back">
              <span aria-hidden>←</span>
              Acasă
            </Link>
            <SunBadge />
          </div>

          <div className="auth-shell-brand-body">
            <div className="auth-shell-eyebrow">{eyebrow}</div>
            <h1 className="auth-shell-headline">
              {headline}
              {headlineAccent && (
                <>
                  {" "}
                  <span style={{ color: "var(--sun)" }}>{headlineAccent}</span>
                </>
              )}
            </h1>
            {sub && <p className="auth-shell-sub">{sub}</p>}
            {bullets && bullets.length > 0 && (
              <ul className="auth-shell-bullets">
                {bullets.map((b, i) => (
                  <li key={i}>
                    <span className="auth-shell-bullet-mark" />
                    <div>
                      <div className="auth-shell-bullet-title">{b.title}</div>
                      <div className="auth-shell-bullet-desc">{b.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="auth-shell-brand-foot">
            <span>Mișcă-te · Trăiește · Evoluează</span>
            <div className="auth-shell-brand-foot-links">
              <Link href="/privacy">Confidențialitate</Link>
              <Link href="/terms">Termeni</Link>
            </div>
          </div>
        </aside>

        <main className="auth-shell-form">
          <div className="auth-shell-form-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SunBadge() {
  return (
    <div
      aria-hidden
      style={{
        height: "44px",
        width: "44px",
        borderRadius: "50%",
        background:
          "radial-gradient(circle at 35% 30%, #FFF3A8 0%, #F5DD5A 45%, #C99818 100%)",
        boxShadow:
          "0 0 0 1px rgba(245,221,90,0.4), 0 0 48px 6px rgba(245,221,90,0.5)",
        flexShrink: 0,
      }}
    />
  );
}
