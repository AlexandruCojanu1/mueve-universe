import WalletButtons from "@/components/dashboard/WalletButtons";
import { appleWalletEnabled } from "@/lib/wallet/apple";
import { googleWalletEnabled } from "@/lib/wallet/google";

export const dynamic = "force-dynamic";

export default function WalletPage() {
  const appleReady = appleWalletEnabled();
  const googleReady = googleWalletEnabled();
  const allReady = appleReady && googleReady;

  return (
    <>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Acces rapid</div>
        <h1 className="dash-page-title">Portofel digital</h1>
        <p className="dash-page-sub">
          Adaugă cardul tău MUEVE UNIVERSE în Apple Wallet sau Google Pay. Coach-ul
          scanează QR-ul din portofel la intrarea în sesiune.
        </p>
      </header>

      <WalletButtons />

      {!allReady && (
        <section className="dash-section" style={{ marginTop: "2rem" }}>
          <div className="dash-card">
            <div className="dash-card-label">Configurare necesară</div>
            {!appleReady && (
              <div>
                <div className="dash-card-value" style={{ fontSize: "0.9rem" }}>
                  Apple Wallet
                </div>
                <ul
                  className="dash-card-meta"
                  style={{
                    listStyle: "disc",
                    paddingLeft: "1.25rem",
                    marginTop: "0.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.2rem",
                  }}
                >
                  <li>Apple Developer account ($99/an)</li>
                  <li>Pass Type ID + cert .p12 (Apple Developer → Identifiers)</li>
                  <li>WWDR cert (apple.com/certificateauthority)</li>
                  <li>
                    Asset-uri PNG în <code>public/wallet/apple/</code>: icon.png (29×29),
                    icon@2x.png, logo.png, logo@2x.png
                  </li>
                  <li>
                    Env: <code>APPLE_PASS_TYPE_ID</code>, <code>APPLE_TEAM_ID</code>,{" "}
                    <code>APPLE_PASS_CERT_BASE64</code>,{" "}
                    <code>APPLE_PASS_CERT_PASSWORD</code>,{" "}
                    <code>APPLE_WWDR_BASE64</code>
                  </li>
                </ul>
              </div>
            )}
            {!googleReady && (
              <div style={{ marginTop: appleReady ? 0 : "1rem" }}>
                <div className="dash-card-value" style={{ fontSize: "0.9rem" }}>
                  Google Pay
                </div>
                <ul
                  className="dash-card-meta"
                  style={{
                    listStyle: "disc",
                    paddingLeft: "1.25rem",
                    marginTop: "0.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.2rem",
                  }}
                >
                  <li>Google Cloud → Wallet API</li>
                  <li>Service Account JSON cu rol Wallet Admin</li>
                  <li>Issuer ID (Google Wallet Console)</li>
                  <li>Generic class creat (o dată) prin API</li>
                  <li>
                    Env: <code>GOOGLE_WALLET_ISSUER_ID</code>,{" "}
                    <code>GOOGLE_WALLET_CLASS_ID</code>,{" "}
                    <code>GOOGLE_WALLET_SERVICE_ACCOUNT_JSON</code>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
