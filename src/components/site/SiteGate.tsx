"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LAUNCH_AT } from "@/lib/launch-window";
import ComingSoon from "@/components/site/ComingSoon";

// Zone funcționale/auth/cont — rămân accesibile ca owner-ul și membrii să
// poată intra chiar și cât timp site-ul public e ascuns.
const OPEN_PREFIXES = [
  "/admin",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/dashboard",
  "/coach",
  "/partner",
  "/q",
  "/checkin",
];

/**
 * Poartă full-screen pe TOT site-ul public până la LAUNCH_AT (diseară 20:00).
 * Landing "/" e deja tratat server-side în page.tsx (fără flash de conținut),
 * așa că îl sărim aici ca să nu dublăm overlay-ul. Restul paginilor publice
 * (ex. /privacy, /terms) primesc același ecran de countdown; zonele funcționale
 * rămân deschise. La 20:00 se dezvăluie singur.
 */
export default function SiteGate() {
  const pathname = usePathname();
  const [past, setPast] = useState(() => Date.now() >= LAUNCH_AT);

  useEffect(() => {
    if (past) return;
    const id = setInterval(() => {
      if (Date.now() >= LAUNCH_AT) setPast(true);
    }, 1000);
    return () => clearInterval(id);
  }, [past]);

  if (pathname === "/") return null; // gated server-side în page.tsx
  const open = OPEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (open) return null;
  if (past) return null;

  return <ComingSoon />;
}
