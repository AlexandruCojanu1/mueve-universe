import { getTheme } from "@/lib/theme";
import ThemeEditor from "@/components/admin/ThemeEditor";

export const dynamic = "force-dynamic";

export default async function ThemePage() {
  const t = await getTheme();
  return (
    <>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Brand</div>
        <h1 className="dash-page-title">Temă globală</h1>
        <p className="dash-page-sub">
          Modifică culorile și fonturile. Schimbările se aplică pe întreg site-ul.
        </p>
      </header>
      <ThemeEditor initial={t} />
    </>
  );
}
