"use client";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/partner", label: "Acasă" },
  { href: "/partner/scan", label: "Scanează" },
  { href: "/partner/history", label: "Istoric" },
  { href: "/partner/settings", label: "Setări" },
];

export default function PartnerNav({
  email,
  companyName,
}: {
  email: string;
  companyName: string;
}) {
  const p = usePathname();
  return (
    <nav className="dash-nav">
      <div className="dash-nav-row">
        <div className="dash-nav-left">
          <Link href="/partner" className="dash-nav-brand" aria-label="Mueve Partner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mueve-logo.png" alt="Mueve" className="brand-logo-img" />
            <span className="dash-nav-brand-sub">Partener</span>
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
          <span className="dash-nav-user">{companyName || email}</span>
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
