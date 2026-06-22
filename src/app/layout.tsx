import type { Metadata } from "next";
import "@/styles/globals.css";
import { I18nClientLayout } from "@/components/i18n-client-layout";

export const metadata: Metadata = {
  metadataBase: new URL("https://cryptorenta.app"),
  title: "CryptoRenta - Cryptocurrency Tax Calculator for Spanish IRPF",
  description:
    "Calculate your cryptocurrency taxes for the Spanish IRPF from your exchange CSVs. 100% client-side, zero-knowledge, open source.",
  keywords: [
    "IRPF cryptocurrency",
    "crypto tax calculator",
    "Spain crypto taxes",
    "bitcoin taxes Spain",
    "FIFO cryptocurrency",
    "Koinly free alternative",
    "crypto fiscal calculator",
  ],
  alternates: {
    canonical: "https://cryptorenta.app",
    languages: {
      es: "https://cryptorenta.app",
      en: "https://cryptorenta.app",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  creator: "CryptoRenta",
  applicationName: "CryptoRenta",
  referrer: "origin-when-cross-origin",
  category: "finance",
  openGraph: {
    title: "CryptoRenta - Free Crypto Tax Calculator",
    description:
      "Calculate your cryptocurrency taxes for the Spanish IRPF. 100% private, no server, open source.",
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "CryptoRenta - Free Crypto Tax Calculator",
    description:
      "Calculate your cryptocurrency taxes for the Spanish IRPF. 100% private, no server.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧮</text></svg>" />
      </head>
      <body className="antialiased min-h-screen bg-background text-foreground">
        <I18nClientLayout>{children}</I18nClientLayout>
      </body>
    </html>
  );
}
