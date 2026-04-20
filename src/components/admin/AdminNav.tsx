"use client";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Secțiuni" },
  { href: "/admin/theme", label: "Temă" },
  { href: "/", label: "Vezi site" },
];

export default function AdminNav({ email }: { email: string }) {
  const p = usePathname();
  return (
    <nav className="border-b border-white/10 bg-black/40 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-black italic uppercase tracking-wider text-[var(--sun)]">
            MUEVE UNIVERSE Admin
          </Link>
          <div className="flex gap-1">
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
          <span className="text-xs opacity-50">{email}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100"
          >
            Ieși
          </button>
        </div>
      </div>
    </nav>
  );
}
