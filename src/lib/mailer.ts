import nodemailer, { type Transporter } from "nodemailer";

let cached: Transporter | null = null;
let cachedUrl: string | null = null;

export function emailEnabled(): boolean {
  return !!(process.env.EMAIL_SERVER && process.env.EMAIL_FROM);
}

function getTransport(): Transporter | null {
  if (!emailEnabled()) return null;
  const url = process.env.EMAIL_SERVER!;
  if (cached && cachedUrl === url) return cached;
  cached = nodemailer.createTransport(url);
  cachedUrl = url;
  return cached;
}

export type SendArgs = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail(args: SendArgs): Promise<
  | { ok: true; id?: string }
  | { ok: false; reason: "not_configured" | "send_failed"; error?: unknown }
> {
  const t = getTransport();
  if (!t) return { ok: false, reason: "not_configured" };
  try {
    const info = await t.sendMail({
      from: process.env.EMAIL_FROM!,
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html,
    });
    return { ok: true, id: info.messageId };
  } catch (error) {
    console.error("[mailer] send failed", error);
    return { ok: false, reason: "send_failed", error };
  }
}

export function wrapBrandHtml(opts: {
  heading: string;
  body: string;
  cta?: { href: string; label: string };
}): string {
  const cta = opts.cta
    ? `<p style="text-align:center;margin:32px 0"><a href="${opts.cta.href}" style="background:#F5F50A;color:#050816;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;font-size:13px;display:inline-block">${opts.cta.label}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#050816;color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px">
      <div style="text-align:center;margin-bottom:32px">
        <div style="font-weight:900;letter-spacing:.25em;font-size:20px;color:#F5F50A">MUEVE UNIVERSE</div>
      </div>
      <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:32px 28px">
        <h1 style="margin:0 0 16px;font-size:22px;font-weight:900;line-height:1.2;letter-spacing:-.01em">${opts.heading}</h1>
        <div style="font-size:15px;line-height:1.6;color:#d9d9e8">${opts.body}</div>
        ${cta}
      </div>
      <div style="text-align:center;margin-top:24px;font-size:12px;color:#7c7c94">
        Mișcă-te · Trăiește · Evoluează
      </div>
    </div>
  </body></html>`;
}
