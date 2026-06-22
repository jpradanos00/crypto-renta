"use client";

import { I18nProvider } from "@/lib/i18n/context";
import { useAppStore } from "@/store/app-store";
import { ThemeProvider } from "@/components/theme-provider";
import { Navigation } from "@/components/navigation";

export function I18nClientLayout({ children }: { children: React.ReactNode }) {
  const setLocale = useAppStore((s) => s.setLocale);

  return (
    <I18nProvider defaultLocale="es" onLocaleChange={setLocale}>
      <ThemeProvider>
        <noscript>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-6 text-center">
            <div className="max-w-md space-y-4">
              <h1 className="text-2xl font-bold">JavaScript necesario / JavaScript Required</h1>
              <p className="text-muted-foreground">
                CryptoRenta funciona 100% en tu navegador. Por favor, activa JavaScript para usar la calculadora.
                <br />
                CryptoRenta runs entirely in your browser. Please enable JavaScript to use the calculator.
              </p>
            </div>
          </div>
        </noscript>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
        >
          Saltar al contenido / Skip to content
        </a>
        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
          <Navigation />
        </header>
        <main id="main-content">{children}</main>
      </ThemeProvider>
    </I18nProvider>
  );
}
