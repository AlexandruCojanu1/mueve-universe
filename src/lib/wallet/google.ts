import { SignJWT, importPKCS8 } from "jose";

export function googleWalletEnabled(): boolean {
  return !!(
    process.env.GOOGLE_WALLET_ISSUER_ID &&
    process.env.GOOGLE_WALLET_CLASS_ID &&
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON
  );
}

type ServiceAccount = { client_email: string; private_key: string };

function parseServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.client_email || !parsed.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

export type GoogleUserData = {
  userId: string;
  name: string | null;
  email: string;
  qrToken: string;
  qrUrl?: string | null;
  planName?: string | null;
};

export async function buildGoogleSaveUrl(user: GoogleUserData): Promise<string> {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const classId = process.env.GOOGLE_WALLET_CLASS_ID;
  const svc = parseServiceAccount();
  if (!issuerId || !classId || !svc) {
    throw new Error("Google Wallet is not configured.");
  }

  const objectId = `${issuerId}.${user.userId.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const fullClassId = classId.includes(".") ? classId : `${issuerId}.${classId}`;

  const genericObject = {
    id: objectId,
    classId: fullClassId,
    state: "ACTIVE",
    cardTitle: { defaultValue: { language: "en", value: "MUEVE UNIVERSE" } },
    header: {
      defaultValue: { language: "en", value: user.planName ?? "Member Card" },
    },
    subheader: {
      defaultValue: { language: "en", value: user.name ?? user.email },
    },
    barcode: {
      type: "QR_CODE",
      value: user.qrUrl || user.qrToken,
      alternateText: "",
    },
    hexBackgroundColor: "#F5F50A",
    logo: {
      sourceUri: { uri: process.env.GOOGLE_WALLET_LOGO_URL ?? "" },
    },
  };

  const payload = {
    iss: svc.client_email,
    aud: "google",
    typ: "savetowallet",
    origins: [] as string[],
    payload: {
      genericObjects: [genericObject],
    },
  };

  const privateKey = await importPKCS8(svc.private_key, "RS256");
  const jwt = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .sign(privateKey);

  return `https://pay.google.com/gp/v/save/${jwt}`;
}
