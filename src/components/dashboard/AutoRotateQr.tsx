"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

type Props = {
  origin: string;
  initialToken: string;
  initialExpiresAt: number;
};

const REFRESH_LEAD_MS = 5_000; // refresh 5s before expiry to avoid race with coach scanner

export default function AutoRotateQr({ origin, initialToken, initialExpiresAt }: Props) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [secondsLeft, setSecondsLeft] = useState<number>(
    Math.max(0, Math.floor((initialExpiresAt - Date.now()) / 1000)),
  );
  const tokenRef = useRef(initialToken);
  const expiryRef = useRef(initialExpiresAt);
  const aliveRef = useRef(true);

  // Render the QR for the current token (initial + every rotation).
  useEffect(() => {
    let cancelled = false;
    const renderToken = async (tok: string) => {
      const url = `${origin}/q/${tok}`;
      const png = await QRCode.toDataURL(url, {
        margin: 1,
        color: { dark: "#F5F50A", light: "#0B1A2E" },
        width: 512,
      });
      if (!cancelled) setDataUrl(png);
    };
    renderToken(tokenRef.current);
    return () => {
      cancelled = true;
    };
  }, [origin]);

  useEffect(() => {
    aliveRef.current = true;

    const tick = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.floor((expiryRef.current - Date.now()) / 1000)));
    }, 500);

    const refresh = async () => {
      try {
        const res = await fetch("/api/qr/dynamic", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { token: string; expiresAt: number };
        if (!aliveRef.current) return;
        tokenRef.current = json.token;
        expiryRef.current = json.expiresAt;
        const url = `${origin}/q/${json.token}`;
        const png = await QRCode.toDataURL(url, {
          margin: 1,
          color: { dark: "#F5F50A", light: "#0B1A2E" },
          width: 512,
        });
        if (aliveRef.current) setDataUrl(png);
      } catch {
        // ignore — UI keeps showing previous QR until next attempt
      }
    };

    const scheduleNext = () => {
      const ms = Math.max(2_000, expiryRef.current - Date.now() - REFRESH_LEAD_MS);
      return setTimeout(async () => {
        if (!aliveRef.current) return;
        await refresh();
        timeoutRef.current = scheduleNext();
      }, ms);
    };

    const timeoutRef = { current: scheduleNext() as ReturnType<typeof setTimeout> };

    const onVis = () => {
      if (document.visibilityState === "visible") {
        // Pull a fresh token whenever the user returns to the tab.
        refresh();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      aliveRef.current = false;
      clearInterval(tick);
      clearTimeout(timeoutRef.current);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [origin]);

  return (
    <>
      <div className="dash-qr-img-wrap">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="QR code" />
        ) : (
          <div style={{ width: "100%", aspectRatio: "1 / 1" }} />
        )}
      </div>
      <div
        style={{
          textAlign: "center",
          fontSize: "0.55rem",
          fontWeight: 800,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          opacity: 0.6,
          marginTop: "0.6rem",
        }}
      >
        Cod activ · expiră în {secondsLeft}s
      </div>
    </>
  );
}
