import type { ReactNode } from "react";

type Variant = "default" | "narrow" | "wide";

export default function DashboardShell({
  nav,
  children,
  variant = "default",
}: {
  nav: ReactNode;
  children: ReactNode;
  variant?: Variant;
}) {
  const mainClass =
    variant === "narrow"
      ? "dash-main dash-main-narrow"
      : variant === "wide"
        ? "dash-main dash-main-wide"
        : "dash-main";

  return (
    <div className="dash-shell">
      <div className="dash-shell-glow dash-shell-glow-sun" aria-hidden />
      <div className="dash-shell-glow dash-shell-glow-violet" aria-hidden />
      <div className="dash-shell-inner">
        {nav}
        <main className={mainClass}>{children}</main>
      </div>
    </div>
  );
}
