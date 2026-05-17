"use client";
import { useEffect, useState } from "react";

type Platform = "apple" | "google" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  // iOS / iPadOS — iPad on iPadOS 13+ reports as Mac, distinguish via touch.
  const isIos =
    /iPhone|iPad|iPod/i.test(ua) ||
    (/Macintosh/i.test(ua) && typeof document !== "undefined" && "ontouchend" in document);
  if (isIos) return "apple";
  if (/Android/i.test(ua)) return "google";
  return "other";
}

export default function WalletButtons({
  appleEnabled = true,
  googleEnabled = true,
}: {
  appleEnabled?: boolean;
  googleEnabled?: boolean;
}) {
  const [appleErr, setAppleErr] = useState<string | null>(null);
  const [googleErr, setGoogleErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<"apple" | "google" | null>(null);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    try {
      setAdded(localStorage.getItem("mueve_wallet_added") === "1");
    } catch {
      /* localStorage blocked */
    }
  }, []);

  const markAdded = () => {
    setAdded(true);
    try {
      localStorage.setItem("mueve_wallet_added", "1");
    } catch {}
  };
  const reset = () => {
    setAdded(false);
    try {
      localStorage.removeItem("mueve_wallet_added");
    } catch {}
  };

  // On a known mobile platform we show only the matching button.
  // On desktop / unknown we fall back to both so the user can pick.
  const showApple = appleEnabled && (platform === "apple" || platform === "other" || platform === null);
  const showGoogle = googleEnabled && (platform === "google" || platform === "other" || platform === null);

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
      markAdded();
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
        markAdded();
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

  if (!appleEnabled && !googleEnabled) return null;

  if (added) {
    return (
      <div className="dash-card" style={{ textAlign: "center" }}>
        <div className="dash-card-label" style={{ color: "#7be37b" }}>
          ✓ Card adăugat în wallet
        </div>
        <button
          type="button"
          onClick={reset}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.55)",
            fontSize: "0.78rem",
            textDecoration: "underline",
            cursor: "pointer",
            marginTop: "0.4rem",
          }}
        >
          Adaugă din nou
        </button>
      </div>
    );
  }

  return (
    <div className={showApple && showGoogle ? "dash-grid-2" : ""}>
      {showApple && (
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
      )}

      {showGoogle && (
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
      )}
    </div>
  );
}
