import WalletButtons from "@/components/dashboard/WalletButtons";
import { appleWalletEnabled } from "@/lib/wallet/apple";
import { googleWalletEnabled } from "@/lib/wallet/google";

export const dynamic = "force-dynamic";

export default function WalletPage() {
  const appleReady = appleWalletEnabled();
  const googleReady = googleWalletEnabled();
  const allReady = appleReady && googleReady;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black uppercase tracking-tight">Portofel digital</h1>
        <p className="opacity-60 mt-2 text-sm">
          Adaugă cardul tău MUEVE UNIVERSE în Apple Wallet sau Google Pay. Coach-ul scanează QR-ul din portofel
          la intrarea în sesiune.
        </p>
      </header>

      <WalletButtons />

      {!allReady && (
        <div className="border border-dashed border-white/15 rounded-lg p-6 space-y-3 text-sm">
          <div className="text-xs uppercase tracking-widest font-bold opacity-60">Configurare necesară</div>
          {!appleReady && (
            <div>
              <div className="font-bold">Apple Wallet:</div>
              <ul className="list-disc list-inside opacity-80 mt-1 space-y-0.5 text-xs">
                <li>Apple Developer account ($99/an)</li>
                <li>Pass Type ID + cert .p12 (Apple Developer → Identifiers)</li>
                <li>WWDR cert (apple.com/certificateauthority)</li>
                <li>Asset-uri PNG în <code className="opacity-80">public/wallet/apple/</code>: icon.png (29×29), icon@2x.png, logo.png, logo@2x.png</li>
                <li>
                  Env: <code className="opacity-80">APPLE_PASS_TYPE_ID</code>,{" "}
                  <code className="opacity-80">APPLE_TEAM_ID</code>,{" "}
                  <code className="opacity-80">APPLE_PASS_CERT_BASE64</code>,{" "}
                  <code className="opacity-80">APPLE_PASS_CERT_PASSWORD</code>,{" "}
                  <code className="opacity-80">APPLE_WWDR_BASE64</code>
                </li>
              </ul>
            </div>
          )}
          {!googleReady && (
            <div>
              <div className="font-bold">Google Pay:</div>
              <ul className="list-disc list-inside opacity-80 mt-1 space-y-0.5 text-xs">
                <li>Google Cloud → Wallet API</li>
                <li>Service Account JSON cu rol Wallet Admin</li>
                <li>Issuer ID (Google Wallet Console)</li>
                <li>Generic class creat (o dată) prin API</li>
                <li>
                  Env: <code className="opacity-80">GOOGLE_WALLET_ISSUER_ID</code>,{" "}
                  <code className="opacity-80">GOOGLE_WALLET_CLASS_ID</code>,{" "}
                  <code className="opacity-80">GOOGLE_WALLET_SERVICE_ACCOUNT_JSON</code>
                </li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
