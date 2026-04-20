"use client";
import { useState } from "react";

export default function WalletButtons() {
  const [appleErr, setAppleErr] = useState<string | null>(null);
  const [googleErr, setGoogleErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<"apple" | "google" | null>(null);

  async function addToApple() {
    setAppleErr(null);
    setBusy("apple");
    try {
      const res = await fetch("/api/wallet/apple", { method: "GET" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setAppleErr(data.error ?? "Nu pot genera cardul Apple.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mueve-universe.pkpass";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setAppleErr("Eroare de rețea.");
    } finally {
      setBusy(null);
    }
  }

  async function addToGoogle() {
    setGoogleErr(null);
    setBusy("google");
    try {
      const res = await fetch("/api/wallet/google");
      const data = (await res.json().catch(() => ({}))) as {
        saveUrl?: string;
        error?: string;
      };
      if (data.saveUrl) {
        window.location.href = data.saveUrl;
        return;
      }
      setGoogleErr(data.error ?? "Nu pot genera cardul Google.");
    } catch {
      setGoogleErr("Eroare de rețea.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-3">
        <div className="text-xs uppercase tracking-widest font-bold opacity-60">Apple Wallet</div>
        <button
          onClick={addToApple}
          disabled={busy === "apple"}
          className="w-full py-3 rounded-md bg-black text-white font-bold text-sm hover:bg-white/10 border border-white/20 disabled:opacity-50 transition"
        >
          {busy === "apple" ? "..." : "Add to Apple Wallet"}
        </button>
        {appleErr && <div className="text-xs text-red-400">{appleErr}</div>}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-3">
        <div className="text-xs uppercase tracking-widest font-bold opacity-60">Google Pay</div>
        <button
          onClick={addToGoogle}
          disabled={busy === "google"}
          className="w-full py-3 rounded-md bg-white text-black font-bold text-sm hover:opacity-90 disabled:opacity-50 transition"
        >
          {busy === "google" ? "..." : "Add to Google Pay"}
        </button>
        {googleErr && <div className="text-xs text-red-400">{googleErr}</div>}
      </div>
    </div>
  );
}
