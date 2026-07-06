import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { getTheme, themeToCssVars } from "@/lib/theme";
import SiteGate from "@/components/site/SiteGate";

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

const SITE_NAME = "MUEVE UNIVERSE";
const SITE_DESCRIPTION =
  "MUEVE UNIVERSE, universul mișcării. Un ecosistem de calisthenics, yoga, alergare și comunitate.";
const OG_IMAGE = "/mueve-logo.png";

export const metadata: Metadata = {
  metadataBase: new URL("https://mueve.ro"),
  title: {
    default: "MUEVE UNIVERSE: Mișcă-te. Trăiește. Evoluează.",
    template: "%s | MUEVE UNIVERSE",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: "Intră în universul mișcării.",
    locale: "ro_RO",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "Intră în universul mișcării.",
    images: [OG_IMAGE],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: "https://mueve.ro",
  logo: "https://mueve.ro/mueve-logo.png",
  description: SITE_DESCRIPTION,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { colors } = await getTheme();
  const css = themeToCssVars(colors);
  return (
    <html lang="ro" className={`${outfit.variable} ${spaceGrotesk.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {/* Cloudflare Web Analytics — site is grey-cloud, so this client-side
            beacon is the only way CF sees visitors. Token is public by design. */}
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={JSON.stringify({ token: "9e5effe52d6549f6b7c5e24f7b942d5f" })}
        />
        <SiteGate />
        {children}
      </body>
    </html>
  );
}
