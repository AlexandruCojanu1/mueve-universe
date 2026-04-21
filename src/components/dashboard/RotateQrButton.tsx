"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RotateQrButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function rotate() {
    if (
      !confirm(
        "Regenerezi QR-ul? QR-ul vechi (inclusiv cel de pe wallet) nu va mai fi valid. Confirmă doar dacă bănuiești că a fost scurs.",
      )
    )
      return;
    setBusy(true);
    try {
      const res = await fetch("/api/qr/rotate", { method: "POST" });
      if (res.ok) router.refresh();
      else alert("Eroare la regenerare.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="dash-link" onClick={rotate} disabled={busy} type="button">
      {busy ? "Regenerez…" : "Regenerează QR →"}
    </button>
  );
}
