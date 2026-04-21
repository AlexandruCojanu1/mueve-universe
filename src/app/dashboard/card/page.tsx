import { auth } from "@/auth";
import { ensureQrToken } from "@/lib/qr-token";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export default async function CardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const token = await ensureQrToken(session.user.id);
  const dataUrl = await QRCode.toDataURL(token, {
    margin: 1,
    color: { dark: "#050816", light: "#F5F50A" },
    width: 512,
  });

  return (
    <>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Acces sesiune</div>
        <h1 className="dash-page-title">Cardul meu</h1>
        <p className="dash-page-sub">
          Arată coach-ului acest QR la intrarea în sesiune.
        </p>
      </header>

      <div className="dash-qr-card">
        <div className="dash-qr-head">
          <div>
            <div className="dash-qr-eyebrow">Member Card</div>
            <div className="dash-qr-brand">MUEVE UNIVERSE</div>
          </div>
        </div>
        <div className="dash-qr-img-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl} alt="QR code" />
        </div>
        <div className="dash-qr-foot">
          <div className="dash-qr-foot-name">{session.user.name || "Membru"}</div>
          <div className="dash-qr-foot-email">{session.user.email}</div>
        </div>
      </div>

      <div className="dash-qr-note">
        Phase 4: acest card va intra automat în Apple Wallet / Google Pay
      </div>
    </>
  );
}
