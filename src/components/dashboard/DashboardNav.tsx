"use client";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/db/schema";

export default function DashboardNav({
  email,
  name,
  role,
}: {
  email: string;
  name?: string;
  role: UserRole;
}) {
  const p = usePathname();
  const links: { href: string; label: string }[] = [
    { href: "/dashboard#xp", label: "XP" },
    { href: "/dashboard#leaderboard", label: "Clasament" },
    { href: "/dashboard#sessions", label: "Sesiuni" },
    { href: "/dashboard#strava", label: "Strava" },
  ];
  if (role === "admin" || role === "coach") {
    links.push({ href: "/coach", label: "Coach" });
  }
  if (role === "admin") {
    links.push({ href: "/admin", label: "Admin" });
  }
  links.push({ href: "/", label: "Site" });

  return (
    <nav className="dash-nav">
      <div className="dash-nav-row">
        <div className="dash-nav-left">
          <Link href="/dashboard" className="dash-nav-brand" aria-label="Mueve Universe">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mueve-logo.png" alt="Mueve" className="brand-logo-img" />
            <span className="dash-nav-brand-sub">Universe</span>
          </Link>
          <div className="dash-nav-links">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={
                  "dash-nav-link" + (p === l.href ? " dash-nav-link-active" : "")
                }
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="dash-nav-right">
          <span className="dash-nav-user">{name || email}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="dash-nav-signout"
          >
            Ieși
          </button>
        </div>
      </div>
    </nav>
  );
}
