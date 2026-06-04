import { db } from "@/db";
import { oblioInvoices } from "@/db/schema";
import { captureError } from "@/lib/observability";

/**
 * Oblio invoicing (neplătitor de TVA + e-Factura).
 *
 * Env:
 *  - OBLIO_EMAIL        — contul Oblio (client_id)
 *  - OBLIO_API_SECRET   — API secret (client_secret, din Setări → Date cont)
 *  - OBLIO_CIF          — CIF-ul firmei emitente
 *  - OBLIO_SERIES_NAME  — seria facturilor (ex. "MUV")
 *  - OBLIO_EFACTURA     — "0" ca să NU trimită în SPV (default: trimite)
 *
 * Toate apelurile sunt best-effort: o factură eșuată nu blochează webhook-ul
 * Stripe; eroarea ajunge în observability.
 */

const BASE = "https://www.oblio.eu/api";

export function oblioEnabled(): boolean {
  return !!(
    process.env.OBLIO_EMAIL &&
    process.env.OBLIO_API_SECRET &&
    process.env.OBLIO_CIF &&
    process.env.OBLIO_SERIES_NAME
  );
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }
  const res = await fetch(`${BASE}/authorize/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.OBLIO_EMAIL!,
      client_secret: process.env.OBLIO_API_SECRET!,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number | string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(`Oblio auth failed (${res.status}): ${JSON.stringify(data).slice(0, 200)}`);
  }
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000,
  };
  return data.access_token;
}

export type OblioInvoiceParams = {
  /** Stripe payment intent / invoice id — idempotency key. */
  stripeRef: string;
  clientName: string;
  clientEmail: string;
  productName: string;
  /** Gross amount in bani (RON cents). */
  amountBani: number;
  currency?: string;
};

/**
 * Issue an Oblio invoice for a Stripe payment, email it to the client and
 * (unless disabled) push it to e-Factura/SPV. Idempotent per stripeRef.
 */
export async function issueOblioInvoice(params: OblioInvoiceParams): Promise<void> {
  if (!oblioEnabled()) return;

  // Idempotency: claim the stripeRef before calling Oblio. If another retry
  // already claimed it, do nothing.
  const claimed = await db
    .insert(oblioInvoices)
    .values({ stripeRef: params.stripeRef })
    .onConflictDoNothing({ target: oblioInvoices.stripeRef })
    .returning({ id: oblioInvoices.id });
  if (claimed.length === 0) return;

  try {
    const token = await getToken();
    const cif = process.env.OBLIO_CIF!;
    const seriesName = process.env.OBLIO_SERIES_NAME!;
    const issueDate = new Date().toISOString().slice(0, 10);

    const res = await fetch(`${BASE}/docs/invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        cif,
        client: {
          name: params.clientName,
          email: params.clientEmail,
          save: 1,
        },
        issueDate,
        seriesName,
        language: "RO",
        precision: 2,
        currency: (params.currency || "RON").toUpperCase(),
        products: [
          {
            name: params.productName,
            price: params.amountBani / 100,
            measuringUnit: "buc",
            quantity: 1,
            vatName: "Neplatitor de TVA",
            vatPercentage: 0,
            vatIncluded: 1,
          },
        ],
        // Oblio emails the invoice PDF to the client.
        sendEmail: 1,
        useStock: 0,
        mentions: "Plată online cu cardul (Stripe).",
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      status?: number;
      statusMessage?: string;
      data?: { seriesName?: string; number?: string; link?: string };
    };
    if (!res.ok || data.status !== 200 || !data.data?.number) {
      throw new Error(
        `Oblio invoice failed (${res.status}): ${data.statusMessage || JSON.stringify(data).slice(0, 200)}`,
      );
    }

    await db
      .insert(oblioInvoices)
      .values({
        stripeRef: params.stripeRef,
        series: data.data.seriesName ?? seriesName,
        number: data.data.number,
        link: data.data.link ?? null,
      })
      .onConflictDoUpdate({
        target: oblioInvoices.stripeRef,
        set: {
          series: data.data.seriesName ?? seriesName,
          number: data.data.number,
          link: data.data.link ?? null,
        },
      });

    // e-Factura (SPV). Best-effort: invoice exists either way.
    if (process.env.OBLIO_EFACTURA !== "0") {
      try {
        const eres = await fetch(`${BASE}/docs/einvoice`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cif,
            seriesName: data.data.seriesName ?? seriesName,
            number: data.data.number,
          }),
        });
        if (!eres.ok) {
          const edata = await eres.text();
          throw new Error(`Oblio e-Factura failed (${eres.status}): ${edata.slice(0, 200)}`);
        }
      } catch (err) {
        captureError(err, { scope: "oblio-einvoice", stripeRef: params.stripeRef });
      }
    }
  } catch (err) {
    // Release the claim so a future retry can re-issue.
    captureError(err, { scope: "oblio-invoice", stripeRef: params.stripeRef });
    const { eq } = await import("drizzle-orm");
    await db
      .delete(oblioInvoices)
      .where(eq(oblioInvoices.stripeRef, params.stripeRef))
      .catch(() => {});
  }
}
