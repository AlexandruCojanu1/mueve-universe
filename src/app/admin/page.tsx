import { db } from "@/db";
import { sections } from "@/db/schema";
import { asc } from "drizzle-orm";
import SectionsList from "@/components/admin/SectionsList";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const rows = await db.select().from(sections).orderBy(asc(sections.order));
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight">Secțiunile paginii</h1>
        <p className="opacity-60 mt-2 text-sm">
          Trage pentru reordonare. Click pe o secțiune pentru a edita conținutul. Butonul <strong className="text-[var(--sun)]">+</strong> adaugă o secțiune nouă.
        </p>
      </header>
      <SectionsList initial={rows} />
    </div>
  );
}
