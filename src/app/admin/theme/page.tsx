import { getTheme } from "@/lib/theme";
import ThemeEditor from "@/components/admin/ThemeEditor";

export const dynamic = "force-dynamic";

export default async function ThemePage() {
  const t = await getTheme();
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight">Temă globală</h1>
        <p className="opacity-60 mt-2 text-sm">
          Modifică culorile și fonturile. Schimbările se aplică pe întreg site-ul.
        </p>
      </header>
      <ThemeEditor initial={t} />
    </div>
  );
}
