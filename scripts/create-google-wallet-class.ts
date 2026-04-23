/**
 * One-shot script — creates the Google Wallet genericClass for MUEVE UNIVERSE
 * membership cards.
 *
 * Run once after Google Wallet Business Console approves your issuer:
 *
 *   npx tsx scripts/create-google-wallet-class.ts
 *
 * Requires env vars in .env.local:
 *   GOOGLE_WALLET_ISSUER_ID              (16-digit number from Wallet Business Console)
 *   GOOGLE_WALLET_CLASS_ID               (e.g. "mueve_universe_membership")
 *   GOOGLE_WALLET_SERVICE_ACCOUNT_JSON   (minified JSON on one line)
 *   GOOGLE_WALLET_LOGO_URL               (public URL to logo PNG)
 *
 * Re-running is safe: if the class already exists, Google returns 409 and the
 * script reports "class already exists" and exits 0.
 */

import { GoogleAuth } from "google-auth-library";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID;
const CLASS_ID = process.env.GOOGLE_WALLET_CLASS_ID || "mueve_universe_membership";
const SERVICE_ACCOUNT_JSON = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON;
const LOGO_URL =
  process.env.GOOGLE_WALLET_LOGO_URL || "https://mueve.ro/mueve-logo.png";

if (!ISSUER_ID) {
  console.error("✗ GOOGLE_WALLET_ISSUER_ID missing in env");
  process.exit(1);
}
if (!SERVICE_ACCOUNT_JSON) {
  console.error("✗ GOOGLE_WALLET_SERVICE_ACCOUNT_JSON missing in env");
  process.exit(1);
}

const classFullId = `${ISSUER_ID}.${CLASS_ID}`;

const classDefinition = {
  id: classFullId,
  classTemplateInfo: {
    cardTemplateOverride: {
      cardRowTemplateInfos: [
        {
          oneItem: {
            item: {
              firstValue: {
                fields: [
                  {
                    fieldPath: "object.textModulesData['membership_tier']",
                  },
                ],
              },
            },
          },
        },
      ],
    },
  },
  hexBackgroundColor: "#F5F50A",
  logo: {
    sourceUri: { uri: LOGO_URL },
    contentDescription: {
      defaultValue: {
        language: "ro",
        value: "MUEVE UNIVERSE",
      },
    },
  },
  reviewStatus: "UNDER_REVIEW",
};

async function main() {
  let credentials;
  try {
    credentials = JSON.parse(SERVICE_ACCOUNT_JSON!);
  } catch (err) {
    console.error(
      "✗ GOOGLE_WALLET_SERVICE_ACCOUNT_JSON is not valid JSON. " +
        "Did you minify it with `jq -c .`? Error:",
      err
    );
    process.exit(1);
  }

  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
  });

  const client = await auth.getClient();
  const url =
    "https://walletobjects.googleapis.com/walletobjects/v1/genericClass";

  console.log(`Creating Google Wallet genericClass:`);
  console.log(`  Issuer: ${ISSUER_ID}`);
  console.log(`  Class:  ${classFullId}`);
  console.log(`  Logo:   ${LOGO_URL}`);
  console.log("");

  try {
    const res = await client.request<{ id: string }>({
      url,
      method: "POST",
      data: classDefinition,
    });
    console.log(`✓ Class created: ${res.data.id}`);
    console.log("");
    console.log("Next steps:");
    console.log(
      `  1. Add to .env.local and Vercel: GOOGLE_WALLET_CLASS_ID=${CLASS_ID}`
    );
    console.log(
      "  2. Test: open /dashboard/wallet in your app, click the Google Wallet button"
    );
  } catch (err: unknown) {
    const e = err as { response?: { status?: number; data?: unknown } };
    const status = e?.response?.status;
    const data = e?.response?.data;

    if (status === 409) {
      console.log(`✓ Class already exists: ${classFullId}`);
      console.log("  (Google returned 409 Conflict — safe to ignore.)");
      process.exit(0);
    }

    console.error(`✗ Failed to create class. HTTP ${status}`);
    console.error(JSON.stringify(data, null, 2));
    console.error("");
    console.error("Common causes:");
    console.error(
      "  - Service account not added as admin in Wallet Business Console"
    );
    console.error("  - Issuer not yet approved (check Business Console dashboard)");
    console.error("  - ISSUER_ID is wrong (should be 16-digit number)");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
