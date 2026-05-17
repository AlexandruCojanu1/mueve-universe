import path from "node:path";
import fs from "node:fs/promises";
import { PKPass } from "passkit-generator";

export type AppleWalletConfig = {
  passTypeIdentifier: string;
  teamIdentifier: string;
  organizationName: string;
  signerCert: Buffer;
  signerKey: Buffer;
  signerKeyPassphrase?: string;
  wwdr: Buffer;
};

function b64(env: string | undefined): Buffer | null {
  if (!env) return null;
  try {
    return Buffer.from(env, "base64");
  } catch {
    return null;
  }
}

export function appleWalletEnabled(): boolean {
  return !!(
    process.env.APPLE_PASS_TYPE_ID &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_PASS_CERT_BASE64 &&
    process.env.APPLE_WWDR_BASE64
  );
}

export function getAppleConfig(): AppleWalletConfig | null {
  if (!appleWalletEnabled()) return null;
  const signerCert = b64(process.env.APPLE_PASS_CERT_BASE64);
  const signerKey = b64(process.env.APPLE_PASS_KEY_BASE64 ?? process.env.APPLE_PASS_CERT_BASE64);
  const wwdr = b64(process.env.APPLE_WWDR_BASE64);
  if (!signerCert || !signerKey || !wwdr) return null;
  return {
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID!,
    teamIdentifier: process.env.APPLE_TEAM_ID!,
    organizationName: process.env.APPLE_ORG_NAME ?? "MUEVE UNIVERSE",
    signerCert,
    signerKey,
    signerKeyPassphrase: process.env.APPLE_PASS_CERT_PASSWORD,
    wwdr,
  };
}


export type AppleUserData = {
  userId: string;
  name: string | null;
  email: string;
  qrToken: string;
  qrUrl?: string | null;
  planName?: string | null;
  streakWeeks?: number;
  creditsRemaining?: number;
  xp?: number;
  tier?: string;
  memberSince?: string; // pre-formatted, e.g. "MAI 2026"
};

export async function buildApplePass(user: AppleUserData): Promise<Buffer> {
  const cfg = getAppleConfig();
  if (!cfg) throw new Error("Apple Wallet is not configured.");
  const templateDir = path.join(process.cwd(), "public", "wallet", "apple");
  const names = [
    "icon.png",
    "icon@2x.png",
    "icon@3x.png",
    "logo.png",
    "logo@2x.png",
    "logo@3x.png",
  ];
  const assets: Record<string, Buffer> = {};
  for (const n of names) {
    try {
      assets[n] = await fs.readFile(path.join(templateDir, n));
    } catch {
      /* optional */
    }
  }
  if (!assets["icon.png"]) {
    throw new Error(
      "Missing required Apple Wallet icon at public/wallet/apple/icon.png (29x29).",
    );
  }
  // Static strip art (sky + gulls). Per-user name is rendered as a secondary
  // field below it so it appears right above the native QR.
  for (const n of ["strip.png", "strip@2x.png", "strip@3x.png"]) {
    try {
      assets[n] = await fs.readFile(path.join(templateDir, n));
    } catch {
      /* optional */
    }
  }

  const pass = new PKPass(
    assets,
    {
      signerCert: cfg.signerCert,
      signerKey: cfg.signerKey,
      signerKeyPassphrase: cfg.signerKeyPassphrase,
      wwdr: cfg.wwdr,
    },
    {
      formatVersion: 1,
      passTypeIdentifier: cfg.passTypeIdentifier,
      teamIdentifier: cfg.teamIdentifier,
      organizationName: cfg.organizationName,
      description: "Mueve Member Card",
      serialNumber: user.userId,
      // Horizon palette: lighter ocean-blue body evokes sky + flight (consecvență
      // = ritmul valurilor, zborul pescărușilor). Yellow accents on labels.
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(58, 110, 165)",
      labelColor: "rgb(255, 232, 92)",
    },
  );

  // storeCard supports the strip image (a horizontal banner under the header) —
  // we use it to render the seagull horizon scene that expresses consecvență.
  pass.type = "storeCard";
  // Native barcode at the bottom — bigger and crisper than baking into strip.
  pass.setBarcodes({
    message: user.qrUrl || user.qrToken,
    format: "PKBarcodeFormatQR",
    messageEncoding: "iso-8859-1",
  });

  // Streak in the header (top-right, small, beside logo) so the strip art
  // breathes and the QR sits closer to mid-card. The number still travels
  // with the member — just understated.
  const streak = user.streakWeeks ?? 0;
  pass.headerFields.push({
    key: "streak",
    label: "CONSECVENȚĂ",
    value: streak > 0 ? `${streak}W` : "—",
  });

  // Member name displayed right above the QR (auxiliary slot is the row
  // closest to the barcode in storeCard layout).
  pass.auxiliaryFields.push({
    key: "name",
    label: "MEMBER",
    value: user.name ?? user.email.split("@")[0],
    textAlignment: "PKTextAlignmentCenter",
  });

  // Backside detail — visible when user taps "(i)" on the pass.
  pass.backFields.push(
    {
      key: "tier",
      label: "Tier",
      value: user.tier ?? "Member",
    },
    {
      key: "xp",
      label: "XP total",
      value: String(user.xp ?? 0),
    },
    {
      key: "since",
      label: "Member din",
      value: user.memberSince ?? String(new Date().getFullYear()),
    },
    {
      key: "plan",
      label: "Plan activ",
      value: user.planName ?? "Niciun pass activ",
    },
    {
      key: "how",
      label: "Cum se folosește",
      value:
        "Arată QR-ul de pe acest card la check-in. Codul este rotativ și se actualizează la fiecare scanare validă, deci nu îl poți da altcuiva.",
    },
    {
      key: "support",
      label: "Suport",
      value: "Contact: mueve.universe@gmail.com",
    },
  );

  return pass.getAsBuffer();
}
