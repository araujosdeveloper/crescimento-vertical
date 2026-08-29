import type { Metadata } from "next";
import "./globals.css";
import { JsonLd } from "@/components/editorial/json-ld";
import { organizationJsonLd, SOCIAL_IMAGE_PATH, websiteJsonLd } from "@/lib/editorial/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://crescimentovertical.com";
const NOINDEX = process.env.SITE_NOINDEX === "true";

export const metadata: Metadata = {
  title: "Crescimento Vertical | Estratégia Digital, Automação e Performance",
  description:
    "Sites, automações, tráfego pago e estruturas digitais para empresas que querem crescer com previsibilidade.",
  keywords: [
    "estratégia digital",
    "automação",
    "performance",
    "landing pages",
    "tráfego pago",
    "funis de venda",
  ],
  metadataBase: new URL(SITE_URL),
  robots: NOINDEX
    ? {
        index: false,
        follow: false,
        noarchive: true,
        nosnippet: true,
        nocache: true,
        googleBot: {
          index: false,
          follow: false,
          noarchive: true,
          nosnippet: true,
          nocache: true,
        },
      }
    : {
        index: true,
        follow: true,
      },
  openGraph: {
    title: "Crescimento Vertical | Estratégia Digital, Automação e Performance",
    description:
      "Estratégia digital, automação e performance para empresas que querem crescer com previsibilidade.",
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "Crescimento Vertical",
    images: [{ url: SOCIAL_IMAGE_PATH, width: 1600, height: 900, alt: "Crescimento Vertical" }],
  },
  twitter: { card: "summary_large_image", title: "Crescimento Vertical | Estratégia Digital, Automação e Performance", description: "Estratégia digital, automação e performance para empresas que querem crescer com previsibilidade.", images: [SOCIAL_IMAGE_PATH] },
  alternates: { canonical: SITE_URL },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body><JsonLd data={organizationJsonLd()} /><JsonLd data={websiteJsonLd()} />{children}</body>
    </html>
  );
}
