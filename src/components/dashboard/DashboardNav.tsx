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
  const links = [
    { href: "/dashboard", label: "Acasă" },
    { href: "/dashboard/card", label: "Cardul meu" },
    { href: "/dashboard/sessions", label: "Sesiuni" },
    { href: "/dashboard/wallet", label: "Portofel" },
    { href: "/", label: "Site" },
  ];
  if (role === "admin" || role === "coach") {
    links.splice(3, 0, { href: "/coach", label: "Coach" });
  }
  if (role === "admin") {
    links.splice(4, 0, { href: "/admin", label: "Admin" });
  }
  return (
    <nav className="border-b border-white/10 bg-black/40 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="font-black italic uppercase tracking-wider text-[var(--sun)]"
          >
            MUEVE UNIVERSE
          </Link>
          <div className="flex gap-1 flex-wrap">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={
                  "px-3 py-1.5 rounded-md text-xs uppercase tracking-widest font-bold transition " +
                  (p === l.href ? "bg-white/10" : "opacity-60 hover:opacity-100")
                }
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs opacity-60">{name || email}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100"
          >
            Ieși
          </button>
        </div>
      </div>
    </nav>
  );
}
