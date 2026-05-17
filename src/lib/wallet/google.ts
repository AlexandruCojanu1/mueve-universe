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
  streakWeeks?: number;
  creditsRemaining?: number;
  xp?: number;
  tier?: string;
  memberSince?: string;
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
  const streak = user.streakWeeks ?? 0;

  const genericObject = {
    id: objectId,
    classId: fullClassId,
    state: "ACTIVE",
    cardTitle: { defaultValue: { language: "ro", value: "MEMBER CARD" } },
    header: {
      defaultValue: {
        language: "ro",
        value: streak > 0 ? `${streak}W CONSECVENȚĂ` : "MEMBER CARD",
      },
    },
    subheader: {
      defaultValue: {
        language: "ro",
        value: user.name ?? user.email.split("@")[0],
      },
    },
    barcode: {
      type: "QR_CODE",
      value: user.qrUrl || user.qrToken,
    },
    // Horizon palette: lighter ocean blue — sky + flight (consecvență).
    hexBackgroundColor: "#3A6EA5",
    logo: {
      sourceUri: { uri: process.env.GOOGLE_WALLET_LOGO_URL ?? "" },
    },
    textModulesData: [
      {
        id: "tier",
        header: "TIER",
        body: user.tier ?? "Member",
      },
      {
        id: "xp",
        header: "XP TOTAL",
        body: String(user.xp ?? 0),
      },
      {
        id: "plan",
        header: "PLAN",
        body: user.planName ?? "Niciun pass activ",
      },
      ...(user.memberSince
        ? [{ id: "since", header: "EST.", body: user.memberSince }]
        : []),
    ],
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
