"use client";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Secțiuni" },
  { href: "/admin/users", label: "Useri" },
  { href: "/admin/partners", label: "Parteneri" },
  { href: "/admin/slots", label: "Slots" },
  { href: "/admin/launch", label: "Lansare" },
  { href: "/admin/activity", label: "Activitate" },
  { href: "/admin/billing", label: "Plăți" },
  { href: "/admin/theme", label: "Temă" },
  { href: "/dashboard", label: "Contul meu" },
  { href: "/", label: "Vezi site" },
];

export default function AdminNav({ email }: { email: string }) {
  const p = usePathname();
  return (
    <nav className="dash-nav">
      <div className="dash-nav-row">
        <div className="dash-nav-left">
          <Link href="/admin" className="dash-nav-brand" aria-label="Mueve Admin">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mueve-logo.png" alt="Mueve" className="brand-logo-img" />
            <span className="dash-nav-brand-sub">Admin</span>
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
          <span className="dash-nav-user">{email}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="dash-nav-signout"
          >
            Ieși
          </button>
        </div>
      </div>
    </nav>
  );
}
