import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { getTheme, themeToCssVars } from "@/lib/theme";

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "700", "900"],
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MUEVE Universe — Mișcă-te. Trăiește. Evoluează.",
  description:
    "MUEVE — universul mișcării. Un ecosistem cosmic de calisthenics, yoga, alergare și comunitate.",
  openGraph: {
    title: "MUEVE Universe",
    description: "Intră în universul mișcării.",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { colors } = await getTheme();
  const css = themeToCssVars(colors);
  return (
    <html lang="ro" className={`${outfit.variable} ${spaceGrotesk.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
