import type { Metadata } from "next";
import "@/styles/globals.css";
import { I18nClientLayout } from "@/components/i18n-client-layout";

export const metadata: Metadata = {
  metadataBase: new URL("https://cryptorenta.app"),
  title:
    "CryptoRenta - Calculadora Impuestos Criptomonedas IRPF España | Gratis y Privada",
  description:
    "Calculadora fiscal de criptomonedas gratis para el IRPF español. Sin registro, 100% privada y open source. Alternativa a Koinly y Cointracker compatible con Hacienda.",
  keywords: [
    "calcular impuestos criptomonedas hacienda",
    "declarar bitcoin renta 2024",
    "como declarar criptomonedas irpf",
    "calculadora fiscal criptomonedas gratis españa",
    "impuestos criptomonedas irpf calculadora",
    "declarar crypto hacienda 2025",
    "IRPF criptomonedas FIFO",
    "calcular renta criptomonedas gratis",
    "alternativa gratis Koinly españa",
    "calculadora impuestos crypto sin registro",
    "crypto tax calculator Spain",
    "Spanish IRPF crypto taxes free",
    "declarar ganancias bitcoin",
    "FIFO crypto tax Spain",
    "informe fiscal criptomonedas AEAT",
    "Cointracker alternativa gratis",
    "calcular plusvalías criptomonedas hacienda",
    "open source crypto tax calculator",
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
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  creator: "CryptoRenta",
  applicationName: "CryptoRenta",
  referrer: "origin-when-cross-origin",
  category: "finance",
  openGraph: {
    title:
      "CryptoRenta - Calculadora IRPF Criptomonedas Gratis y Privada",
    description:
      "Calcula tus impuestos de criptomonedas para el IRPF español. 100% privado, sin servidor, sin registro. Open source. Alternativa gratis a Koinly.",
    type: "website",
    locale: "es_ES",
    siteName: "CryptoRenta",
    url: "https://cryptorenta.app",
    images: [
      {
        url: "https://cryptorenta.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "CryptoRenta - Calculadora de impuestos criptomonedas IRPF España",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "CryptoRenta - Calculadora IRPF Criptomonedas Gratis y Privada",
    description:
      "Calcula tus impuestos de criptomonedas para el IRPF español. 100% privado, sin servidor. Open source.",
    images: ["https://cryptorenta.app/og-image.png"],
    creator: "@cryptorenta",
  },
  other: {
    "google-site-verification": "VERIFICATION_TOKEN_PLACEHOLDER",
    "theme-color": "#0a0a0b",
    "apple-mobile-web-app-title": "CryptoRenta",
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
        <link
          rel="preconnect"
          href="https://github.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://www.youtube-nocookie.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://github.com" />
        <link
          rel="dns-prefetch"
          href="https://www.youtube-nocookie.com"
        />
        <link
          rel="dns-prefetch"
          href="https://api.github.com"
        />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧮</text></svg>"
        />
      </head>
      <body
        className="antialiased min-h-screen bg-background text-foreground"
        suppressHydrationWarning
      >
        <I18nClientLayout>{children}</I18nClientLayout>
      </body>
    </html>
  );
}
