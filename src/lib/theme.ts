import { db } from "@/db";
import { theme as themeTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_COLORS, DEFAULT_FONTS } from "./content-types";

export async function getTheme() {
  const rows = await db.select().from(themeTable).where(eq(themeTable.id, "default")).limit(1);
  const row = rows[0];
  return {
    colors: (row?.colors as Record<string, string>) || DEFAULT_COLORS,
    fonts: (row?.fonts as { heading: string; body: string }) || DEFAULT_FONTS,
  };
}

export function themeToCssVars(colors: Record<string, string>): string {
  const map: Record<string, string> = {
    deep: "--deep",
    mid: "--mid",
    light: "--light",
    sun: "--sun",
    white: "--w",
    black: "--b",
    forge: "--forge",
    temple: "--temple",
    path: "--path",
    sanctuary: "--sanctuary",
  };
  const entries = Object.entries(colors)
    .filter(([k]) => map[k])
    .map(([k, v]) => `${map[k]}:${v}`);
  if (colors.sun) {
    const hex = colors.sun.replace("#", "");
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      entries.push(`--sun-g:rgba(${r},${g},${b},0.3)`);
    }
  }
  return `:root{${entries.join(";")}}`;
}
