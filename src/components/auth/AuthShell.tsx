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
    <div className="auth-shell relative min-h-screen w-full overflow-hidden">
      <StarfieldBg />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(245,221,90,0.22), transparent 55%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 85% 110%, rgba(120,60,200,0.22), transparent 55%)",
        }}
      />

      <div className="relative z-10 w-full min-h-screen flex flex-col lg:flex-row">
        <aside
          className="flex flex-col justify-between px-7 py-8 lg:px-14 lg:py-12 lg:w-[46%] lg:min-h-screen"
          style={{
            borderRight: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(180deg, rgba(10,14,30,0.35) 0%, rgba(10,14,30,0.15) 100%)",
          }}
        >
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.35em] font-bold opacity-60 hover:opacity-100 transition"
            >
              <span aria-hidden>←</span>
              Acasă
            </Link>
            <SunBadge />
          </div>

          <div className="py-10 lg:py-0 space-y-6 max-w-[520px]">
            <div className="text-[0.62rem] uppercase tracking-[0.35em] font-black text-[var(--sun)]">
              {eyebrow}
            </div>
            <h1
              className="font-black tracking-tight leading-[0.95]"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
              }}
            >
              {headline}
              {headlineAccent && (
                <>
                  {" "}
                  <span className="text-[var(--sun)]">{headlineAccent}</span>
                </>
              )}
            </h1>
            {sub && (
              <p className="text-sm md:text-[0.95rem] opacity-75 leading-relaxed max-w-[90%]">
                {sub}
              </p>
            )}
            {bullets && bullets.length > 0 && (
              <ul className="pt-2 space-y-3">
                {bullets.map((b, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span
                      className="mt-[0.45rem] h-[3px] w-6 rounded-full shrink-0"
                      style={{ background: "var(--sun)" }}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-black tracking-tight">{b.title}</div>
                      <div className="text-xs opacity-65 leading-relaxed mt-1">
                        {b.desc}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="hidden lg:flex items-center justify-between text-[0.6rem] uppercase tracking-[0.35em] font-bold opacity-55">
            <span>Mișcă-te · Trăiește · Evoluează</span>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:opacity-100 transition">
                Confidențialitate
              </Link>
              <Link href="/terms" className="hover:opacity-100 transition">
                Termeni
              </Link>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex items-start lg:items-center justify-center px-6 py-10 lg:px-12 lg:py-14">
          <div className="w-full max-w-[440px]">{children}</div>
        </main>

        <div className="lg:hidden flex items-center justify-between px-7 py-6 text-[0.6rem] uppercase tracking-[0.3em] font-bold opacity-55 border-t border-white/10">
          <span>Mișcă-te · Trăiește · Evoluează</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:opacity-100 transition">
              Privacy
            </Link>
            <Link href="/terms" className="hover:opacity-100 transition">
              Termeni
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function SunBadge() {
  return (
    <div
      aria-hidden
      className="h-11 w-11 rounded-full"
      style={{
        background:
          "radial-gradient(circle at 35% 30%, #FFF3A8 0%, #F5DD5A 45%, #C99818 100%)",
        boxShadow:
          "0 0 0 1px rgba(245,221,90,0.4), 0 0 48px 6px rgba(245,221,90,0.5)",
      }}
    />
  );
}
