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

async function loadTemplateAssets(dir: string): Promise<Record<string, Buffer>> {
  const names = ["icon.png", "icon@2x.png", "logo.png", "logo@2x.png"];
  const out: Record<string, Buffer> = {};
  for (const n of names) {
    const p = path.join(dir, n);
    try {
      out[n] = await fs.readFile(p);
    } catch {
      // optional — if missing, pass validation may fail on Apple's side; user is told to add
    }
  }
  return out;
}

export type AppleUserData = {
  userId: string;
  name: string | null;
  email: string;
  qrToken: string;
  qrUrl?: string | null;
  planName?: string | null;
};

export async function buildApplePass(user: AppleUserData): Promise<Buffer> {
  const cfg = getAppleConfig();
  if (!cfg) throw new Error("Apple Wallet is not configured.");
  const templateDir = path.join(process.cwd(), "public", "wallet", "apple");
  const assets = await loadTemplateAssets(templateDir);
  if (!assets["icon.png"]) {
    throw new Error(
      "Missing required Apple Wallet icon at public/wallet/apple/icon.png (29x29). Add icon.png, icon@2x.png, logo.png, logo@2x.png before generating passes.",
    );
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
      description: "MUEVE UNIVERSE Member Card",
      serialNumber: user.userId,
      foregroundColor: "rgb(5, 8, 22)",
      backgroundColor: "rgb(245, 245, 10)",
      labelColor: "rgb(5, 8, 22)",
      logoText: "MUEVE UNIVERSE",
    },
  );

  pass.type = "generic";
  pass.setBarcodes({
    message: user.qrUrl || user.qrToken,
    format: "PKBarcodeFormatQR",
    messageEncoding: "iso-8859-1",
    altText: "Scan to validate",
  });

  pass.primaryFields.push({
    key: "plan",
    label: "PLAN",
    value: user.planName ?? "Member",
  });
  pass.secondaryFields.push({
    key: "name",
    label: "MEMBER",
    value: user.name ?? user.email,
  });
  pass.auxiliaryFields.push({
    key: "since",
    label: "SINCE",
    value: new Date().getFullYear().toString(),
  });

  return pass.getAsBuffer();
}
