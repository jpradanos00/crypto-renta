import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Calculadora Impuestos Criptomonedas IRPF - Sube tu CSV y Calcula Gratis",
  description:
    "Calcula tus impuestos de criptomonedas para el IRPF español. Sube tu CSV de Coinbase, Binance o Kraken. FIFO, 100% privado, sin registro y gratuito.",
  keywords: [
    "calcular impuestos crypto",
    "subir CSV Coinbase IRPF",
    "calculadora criptomonedas hacienda",
    "calcular plusvalías criptomonedas",
    "FIFO calculator Spain",
    "tax crypto calculator free",
    "impuestos bitcoin españa calculadora",
  ],
  alternates: {
    canonical: "https://jpradanos00.github.io/crypto-renta/calculadora",
  },
  openGraph: {
    title:
      "Calculadora IRPF Criptomonedas - Sube tu CSV Gratis | CryptoRenta",
    description:
      "Calcula tus impuestos de criptomonedas para el IRPF español subiendo tus CSVs. 100% privado, sin registro, open source.",
    type: "website",
    locale: "es_ES",
    url: "https://jpradanos00.github.io/crypto-renta/calculadora",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Calculadora IRPF Criptomonedas - Sube tu CSV Gratis | CryptoRenta",
    description:
      "Calcula tus impuestos de criptomonedas para el IRPF español subiendo tus CSVs. 100% privado, sin registro.",
    images: ["https://jpradanos00.github.io/crypto-renta/og-image.png"],
  },
};

export default function CalculadoraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
