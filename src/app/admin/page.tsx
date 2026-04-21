import { auth } from "@/auth";
import { db } from "@/db";
import { sections } from "@/db/schema";
import { asc } from "drizzle-orm";
import SectionsList from "@/components/admin/SectionsList";
import EmailTestButton from "@/components/admin/EmailTestButton";
import { emailEnabled } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [rows, session] = await Promise.all([
    db.select().from(sections).orderBy(asc(sections.order)),
    auth(),
  ]);
  const ok = emailEnabled();
  return (
    <>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Administrare</div>
        <h1 className="dash-page-title">Secțiunile paginii</h1>
        <p className="dash-page-sub">
          Trage pentru reordonare. Click pe o secțiune pentru a edita conținutul.
          Butonul <strong style={{ color: "var(--sun)" }}>+</strong> adaugă o secțiune
          nouă.
        </p>
      </header>

      <div className="dash-card" style={{ marginBottom: "1.5rem" }}>
        <div className="dash-card-head">
          <div>
            <div className="dash-card-eyebrow">Email</div>
            <div className="dash-card-title">
              SMTP · {ok ? "✓ configurat" : "✕ neconfigurat"}
            </div>
          </div>
        </div>
        {ok ? (
          <>
            <p className="dash-card-body" style={{ marginBottom: 12 }}>
              Trimite un email test ca să verifici că Resend răspunde corect.
            </p>
            <EmailTestButton defaultTo={session?.user?.email ?? ""} />
          </>
        ) : (
          <p className="dash-card-body">
            Setează <code>EMAIL_SERVER</code> + <code>EMAIL_FROM</code> în{" "}
            <code>.env.local</code> (Resend SMTP) și repornește dev-ul.
          </p>
        )}
      </div>

      <SectionsList initial={rows} />
    </>
  );
}
