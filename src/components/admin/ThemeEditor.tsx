"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTheme } from "@/app/admin/actions";
import { Card, Label, Button, Select } from "./fields";
import { DEFAULT_COLORS, DEFAULT_FONTS } from "@/lib/content-types";

const COLOR_FIELDS: { key: keyof typeof DEFAULT_COLORS; label: string; hint: string }[] = [
  { key: "deep", label: "Deep background", hint: "Fundalul cosmic principal" },
  { key: "mid", label: "Mid background", hint: "Gradient tranziție" },
  { key: "light", label: "Light background", hint: "Gradient jos" },
  { key: "sun", label: "Sun accent", hint: "Galben accent global" },
  { key: "white", label: "Text principal", hint: "" },
  { key: "black", label: "Black", hint: "" },
  { key: "forge", label: "Forge (calisthenics)", hint: "Albastru" },
  { key: "temple", label: "Temple (yoga)", hint: "Mov" },
  { key: "path", label: "Path (alergare)", hint: "Cyan" },
  { key: "sanctuary", label: "Sanctuary (social)", hint: "Portocaliu" },
];

const FONT_OPTIONS = [
  { value: "Outfit", label: "Outfit (default heading)" },
  { value: "Space Grotesk", label: "Space Grotesk (default body)" },
  { value: "Inter", label: "Inter" },
  { value: "Manrope", label: "Manrope" },
  { value: "Sora", label: "Sora" },
  { value: "DM Sans", label: "DM Sans" },
  { value: "Rubik", label: "Rubik" },
];

export default function ThemeEditor({ initial }: { initial: { colors: Record<string, string>; fonts: { heading: string; body: string } } }) {
  const router = useRouter();
  const [colors, setColors] = useState({ ...DEFAULT_COLORS, ...initial.colors });
  const [fonts, setFonts] = useState({ ...DEFAULT_FONTS, ...initial.fonts });
  const [dirty, setDirty] = useState(false);
  const [saving, start] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const setColor = (k: string, v: string) => {
    setColors((prev) => ({ ...prev, [k]: v }));
    setDirty(true);
  };

  const setFont = (k: "heading" | "body", v: string) => {
    setFonts((prev) => ({ ...prev, [k]: v }));
    setDirty(true);
  };

  const reset = () => {
    setColors({ ...DEFAULT_COLORS });
    setFonts({ ...DEFAULT_FONTS });
    setDirty(true);
  };

  const save = () => {
    start(async () => {
      await updateTheme(colors, fonts);
      setDirty(false);
      setSavedAt(new Date());
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {savedAt && !dirty && <span className="text-xs opacity-60">Salvat la {savedAt.toLocaleTimeString()}</span>}
          {dirty && <span className="text-xs text-[var(--sun)]">Modificări nesalvate</span>}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={reset}>Resetează</Button>
          <Button onClick={save} disabled={!dirty || saving}>
            {saving ? "Salvez..." : "Salvează"}
          </Button>
        </div>
      </div>

      <Card title="Culori">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COLOR_FIELDS.map((f) => (
            <div key={f.key} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-md p-3">
              <input
                type="color"
                value={colors[f.key]}
                onChange={(e) => setColor(f.key, e.target.value)}
                className="w-12 h-10 rounded cursor-pointer bg-transparent border border-white/15"
                aria-label={f.label}
              />
              <div className="flex-1">
                <div className="text-xs font-bold uppercase tracking-widest">{f.label}</div>
                {f.hint && <div className="text-[11px] opacity-50">{f.hint}</div>}
                <input
                  type="text"
                  value={colors[f.key]}
                  onChange={(e) => setColor(f.key, e.target.value)}
                  className="mt-1.5 w-full px-2 py-1 rounded bg-black/50 border border-white/15 text-[11px] font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Fonturi">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label hint="Folosit pentru titluri">Font titluri</Label>
            <Select
              value={fonts.heading}
              onChange={(v) => setFont("heading", v)}
              options={FONT_OPTIONS}
            />
          </div>
          <div>
            <Label hint="Folosit pentru paragrafe">Font body</Label>
            <Select
              value={fonts.body}
              onChange={(v) => setFont("body", v)}
              options={FONT_OPTIONS}
            />
          </div>
        </div>
        <div className="text-[11px] opacity-50">
          Notă: fonturile trebuie pre-încărcate în layout. În acest moment Outfit și Space Grotesk sunt garantate. Alte fonturi pot necesita configurare adițională.
        </div>
      </Card>
    </div>
  );
}
