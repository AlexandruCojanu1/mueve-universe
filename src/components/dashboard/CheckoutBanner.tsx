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
      className={"dash-banner " + (ok ? "dash-banner-success" : "dash-banner-error")}
    >
      <div>
        <div className="dash-banner-title">
          {ok ? "Plată reușită" : "Plată anulată"}
        </div>
        <div className="dash-banner-body">
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
        className="dash-banner-close"
      >
        Închide
      </button>
    </div>
  );
}
