import { auth } from "@/auth";
import { ensureQrToken } from "@/lib/qr-token";
import { getCreditBalance, getActivePassRow } from "@/lib/credits";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export default async function CardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const [token, credits, pass] = await Promise.all([
    ensureQrToken(session.user.id),
    getCreditBalance(session.user.id),
    getActivePassRow(session.user.id),
  ]);
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
          <div
            style={{
              textAlign: "right",
              display: "flex",
              flexDirection: "column",
              gap: "0.2rem",
            }}
          >
            <div
              style={{
                fontSize: "0.55rem",
                fontWeight: 900,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                opacity: 0.7,
              }}
            >
              Clase rămase
            </div>
            <div
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 900,
                fontSize: "1.75rem",
                lineHeight: 1,
              }}
            >
              {credits.total}
            </div>
          </div>
        </div>
        <div className="dash-qr-img-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl} alt="QR code" />
        </div>
        <div className="dash-qr-foot">
          <div className="dash-qr-foot-name">{session.user.name || "Membru"}</div>
          <div className="dash-qr-foot-email">{session.user.email}</div>
          <div
            style={{
              fontSize: "0.58rem",
              fontWeight: 800,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              opacity: 0.65,
              marginTop: "0.35rem",
            }}
          >
            {pass
              ? `Pass activ${
                  pass.currentPeriodEnd
                    ? ` · până la ${pass.currentPeriodEnd.toLocaleDateString("ro-RO")}`
                    : ""
                }`
              : "Fără Pass activ"}
            {credits.nextExpiry && credits.total > 0 && (
              <>
                {" · "}
                următ. expirare {credits.nextExpiry.toLocaleDateString("ro-RO")}
              </>
            )}
          </div>
        </div>
      </div>

      {!pass && (
        <div
          className="dash-banner dash-banner-error"
          style={{ marginTop: "2rem" }}
        >
          <div>
            <div className="dash-banner-title">Pass inactiv</div>
            <div className="dash-banner-body">
              Cardul e generat, dar ai nevoie de Pass activ + clase cumpărate ca
              să intri la sesiuni.
            </div>
          </div>
        </div>
      )}
      {pass && credits.total === 0 && (
        <div
          className="dash-banner dash-banner-info"
          style={{ marginTop: "2rem" }}
        >
          <div>
            <div className="dash-banner-title">Fără clase rămase</div>
            <div className="dash-banner-body">
              Ai Pass activ, dar nu ai clase cumpărate. Intră la prețuri și
              alege câte vrei.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
