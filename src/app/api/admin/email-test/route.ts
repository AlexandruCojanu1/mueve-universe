import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendEmail, emailEnabled, wrapBrandHtml } from "@/lib/mailer";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!emailEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "EMAIL_SERVER / EMAIL_FROM lipsesc. Adaugă-le în .env.local apoi repornește dev.",
      },
      { status: 503 },
    );
  }
  const body = (await req.json().catch(() => ({}))) as { to?: string };
  const to = (body.to || session.user.email || "").toString();
  if (!to)
    return NextResponse.json({ error: "Lipsește destinatar" }, { status: 400 });

  const result = await sendEmail({
    to,
    subject: "Test email — MUEVE UNIVERSE",
    text: `Ping. Dacă citești asta, SMTP-ul merge.\nTimestamp: ${new Date().toISOString()}`,
    html: wrapBrandHtml({
      heading: "Email test ✓",
      body: `<p>Dacă primești acest mesaj, configurarea SMTP funcționează.</p><p style="opacity:.7;font-size:13px">${new Date().toISOString()}</p>`,
    }),
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: "Trimitere eșuată. Verifică log-urile serverului." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, id: result.id });
}
