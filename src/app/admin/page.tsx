import { db } from "@/db";
import { sections } from "@/db/schema";
import { asc } from "drizzle-orm";
import SectionsList from "@/components/admin/SectionsList";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const rows = await db.select().from(sections).orderBy(asc(sections.order));
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
      <SectionsList initial={rows} />
    </>
  );
}
