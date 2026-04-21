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
    <div className="dash-grid-2">
      <div className="dash-card">
        <div className="dash-card-label">Apple Wallet</div>
        <button
          onClick={addToApple}
          disabled={busy === "apple"}
          className="dash-btn dash-btn-dark dash-btn-wide"
        >
          {busy === "apple" ? "..." : "Add to Apple Wallet"}
        </button>
        {appleErr && (
          <div style={{ fontSize: "0.72rem", color: "#fca5a5" }}>{appleErr}</div>
        )}
      </div>

      <div className="dash-card">
        <div className="dash-card-label">Google Pay</div>
        <button
          onClick={addToGoogle}
          disabled={busy === "google"}
          className="dash-btn dash-btn-light dash-btn-wide"
        >
          {busy === "google" ? "..." : "Add to Google Pay"}
        </button>
        {googleErr && (
          <div style={{ fontSize: "0.72rem", color: "#fca5a5" }}>{googleErr}</div>
        )}
      </div>
    </div>
  );
}
