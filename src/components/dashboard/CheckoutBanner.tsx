"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutBanner({ status }: { status?: string }) {
  const router = useRouter();
  const [visible, setVisible] = useState(!!status);

  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => {
      setVisible(false);
      router.replace("/dashboard");
    }, 6000);
    return () => clearTimeout(t);
  }, [status, router]);

  if (!visible || !status) return null;

  const ok = status === "success";
  return (
    <div
      className={
        "rounded-lg p-4 flex items-start justify-between gap-4 border " +
        (ok
          ? "bg-[var(--sun)]/10 border-[var(--sun)]/40 text-[var(--sun)]"
          : "bg-red-500/10 border-red-500/40 text-red-300")
      }
    >
      <div>
        <div className="font-black uppercase tracking-widest text-xs">
          {ok ? "Plată reușită" : "Plată anulată"}
        </div>
        <div className="text-sm opacity-90 mt-1">
          {ok
            ? "Mulțumim! Planul tău va fi activ în câteva secunde după confirmarea Stripe."
            : "Nu ai finalizat plata. Poți încerca din nou oricând."}
        </div>
      </div>
      <button
        onClick={() => {
          setVisible(false);
          router.replace("/dashboard");
        }}
        className="text-xs uppercase tracking-widest opacity-70 hover:opacity-100"
      >
        Închide
      </button>
    </div>
  );
}
