import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Cómo Descargar CSV de Coinbase para Declarar Criptomonedas - Guía Paso a Paso",
  description:
    "Guía paso a paso para descargar tu historial de transacciones de Coinbase, Binance y Kraken. Exporta tus CSVs para declarar criptomonedas en el IRPF español.",
  keywords: [
    "como descargar CSV Coinbase",
    "exportar transacciones criptomonedas",
    "descargar historial Coinbase",
    "CSV transacciones crypto hacienda",
    "exportar historial Binance IRPF",
    "como sacar CSV de Coinbase",
    "descargar transacciones crypto para declarar",
    "guía exportar CSV Coinbase",
    "Coinbase transaction history CSV español",
  ],
  alternates: {
    canonical: "https://jpradanos00.github.io/crypto-renta/guia",
  },
  openGraph: {
    title:
      "Cómo Descargar CSV de Coinbase para Declarar Criptomonedas | CryptoRenta",
    description:
      "Guía paso a paso para descargar tu historial de transacciones de Coinbase, Binance y Kraken para el IRPF español.",
    type: "website",
    locale: "es_ES",
    url: "https://jpradanos00.github.io/crypto-renta/guia",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Cómo Descargar CSV de Coinbase para Declarar Criptomonedas | CryptoRenta",
    description:
      "Guía paso a paso para descargar tu historial de transacciones de Coinbase, Binance y Kraken para el IRPF español.",
  },
};

export default function GuiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
