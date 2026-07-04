"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * The member's discount card, rendered in-app so it never depends on Apple/
 * Google Wallet being configured. It encodes the same public scan URL the
 * wallet pass would (`/q/<qrToken>`): the in-app partner scanner reads the
 * token, and a plain phone camera opens the /q/ landing. Static (no rotation)
 * for launch reliability — the persistent qrToken is what partner/verify accepts.
 */
export default function MemberQrCard({
  origin,
  token,
}: {
  origin: string;
  token: string;
}) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(`${origin}/q/${token}`, {
      margin: 1,
      color: { dark: "#F5F50A", light: "#0B1A2E" },
      width: 512,
    })
      .then((png) => {
        if (!cancelled) setDataUrl(png);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [origin, token]);

  return (
    <div className="dash-qr-img-wrap">
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt="Cardul tău MUEVE" />
      ) : (
        <div style={{ width: "100%", aspectRatio: "1 / 1" }} />
      )}
    </div>
  );
}
