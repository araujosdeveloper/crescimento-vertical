import type { Metadata } from "next";
import "./globals.css";

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
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
