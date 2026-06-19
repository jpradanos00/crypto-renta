import type { Metadata } from "next";
import "@/styles/globals.css";
import { Navigation } from "@/components/navigation";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "CryptoRenta - Calculadora de Impuestos de Criptomonedas para el IRPF España",
  description:
    "CryptoRenta - Calculadora de impuestos de criptomonedas para el IRPF en España. Calcula tus impuestos a partir de tus CSVs de Coinbase. 100% client-side, zero-knowledge.",
  keywords: [
    "IRPF criptomonedas",
    "calculadora impuestos crypto",
    "declaración renta Coinbase",
    "impuestos bitcoin España",
    "FIFO criptomonedas",
  ],
  openGraph: {
    title: "CryptoRenta - Calculadora IRPF Criptomonedas",
    description:
      "Calcula tus impuestos de criptomonedas para el IRPF español. 100% privado, sin servidor.",
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "CryptoRenta - Calculadora IRPF Criptomonedas",
    description:
      "Calcula tus impuestos de criptomonedas para el IRPF español. 100% privado, sin servidor.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground">
        <ThemeProvider>
        <noscript>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-6 text-center">
            <div className="max-w-md space-y-4">
              <h1 className="text-2xl font-bold">JavaScript necesario</h1>
              <p className="text-muted-foreground">
                CryptoRenta funciona 100% en tu navegador. Por favor, activa JavaScript para usar la calculadora.
              </p>
            </div>
          </div>
        </noscript>
        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
          <Navigation />
        </header>
        {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
