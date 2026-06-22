"use client";

import Link from "next/link";
import { Calculator, Shield, Code2, Scale, ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n/context";

const CURRENT_YEAR = new Date().getFullYear();

const PAGE_SCHEMAS = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "CryptoRenta",
      "url": "https://jpradanos00.github.io/crypto-renta",
      "description": "Calculadora gratuita de impuestos de criptomonedas para el IRPF español. 100% privada, procesamiento local en el navegador, open source.",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR",
      },
      "browserRequirements": "Requires JavaScript",
      "softwareVersion": "1.0",
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "¿Cómo se calculan los impuestos de criptomonedas en España?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "En España, las ganancias y pérdidas patrimoniales por criptomonedas se declaran en el IRPF usando el método FIFO (First In, First Out). Las ventas y swaps van a las casillas 1800-1814, el staking a la casilla 0027, y los airdrops a las casillas 0304+. Cada operación de venta, intercambio o pago con criptomonedas genera un hecho imponible que debes declarar ante la AEAT en la campaña de la renta.",
          },
        },
        {
          "@type": "Question",
          "name": "¿Es gratis CryptoRenta?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sí, CryptoRenta es completamente gratis y open source. A diferencia de Koinly, Cointracker u otras alternativas que cobran más de 200€ por informe fiscal, CryptoRenta no tiene ningún coste. No necesitas registrarte ni proporcionar ningún dato personal. Todo el código está disponible en GitHub para su auditoría pública.",
          },
        },
        {
          "@type": "Question",
          "name": "¿Mis datos salen de mi ordenador al usar CryptoRenta?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. CryptoRenta funciona con arquitectura zero-knowledge: todo el procesamiento se realiza localmente en tu navegador. Tus CSVs y datos financieros nunca se envían a ningún servidor externo. Es una SPA (Single Page Application) que procesa toda la información en tu dispositivo, garantizando la máxima privacidad de tus datos fiscales.",
          },
        },
        {
          "@type": "Question",
          "name": "¿Qué exchanges son compatibles con CryptoRenta?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Actualmente CryptoRenta es compatible con archivos CSV de Coinbase. El soporte para Binance y Kraken está en desarrollo. Si quieres contribuir con un parser para tu exchange, el proyecto es open source y acepta contribuciones en GitHub.",
          },
        },
        {
          "@type": "Question",
          "name": "¿Cómo descargo el CSV de transacciones de Coinbase?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Inicia sesión en Coinbase desde un ordenador, ve a Perfil → Extractos e informes, selecciona 'Transaction history' en formato CSV con el rango de fechas completo de tu historial. Asegúrate de que la moneda base sea EUR. Descarga y repite para todos los años en los que hayas operado. Puedes consultar la guía paso a paso en la sección Guía de CryptoRenta.",
          },
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "CryptoRenta",
          "item": "https://jpradanos00.github.io/crypto-renta",
        },
      ],
    },
  ],
};

export default function HomePage() {
  const { t } = useT();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(PAGE_SCHEMAS),
        }}
      />
      <div className="flex min-h-screen flex-col">
        {/* Hero */}
        <section
          className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center"
          aria-labelledby="hero-heading"
        >
          <div className="max-w-3xl space-y-8">
            <div className="space-y-4">
              <h1
                id="hero-heading"
                className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl"
              >
                CryptoRenta
              </h1>
              <p className="text-xl text-muted-foreground sm:text-2xl">
                {t("home.heroSubtitle")}
              </p>
            </div>
            <Link
              href="/calculadora"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-background"
            >
              {t("home.cta")}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="https://github.com/jpradanos00/crypto-renta"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/20"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              {t("home.github")}
            </a>
          </div>
        </section>

        {/* Cómo funciona */}
        <section
          className="border-t border-border bg-card px-4 py-20"
          aria-labelledby="how-heading"
        >
          <div className="mx-auto max-w-5xl space-y-12">
            <div className="text-center space-y-4">
              <h2
                id="how-heading"
                className="text-3xl font-bold tracking-tight"
              >
                {t("home.howTitle")}
              </h2>
              <p className="text-muted-foreground">
                {t("home.howSubtitle")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  step: "01",
                  icon: Calculator,
                  title: t("home.step1Title"),
                  description: t("home.step1Desc"),
                },
                {
                  step: "02",
                  icon: Code2,
                  title: t("home.step2Title"),
                  description: t("home.step2Desc"),
                },
                {
                  step: "03",
                  icon: Scale,
                  title: t("home.step3Title"),
                  description: t("home.step3Desc"),
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-xl border border-border bg-background p-6 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {t("home.stepLabel", { step: item.step })}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Confianza */}
        <section
          className="border-t border-border px-4 py-20"
          aria-labelledby="trust-heading"
        >
          <div className="mx-auto max-w-5xl space-y-12">
            <div className="text-center space-y-4">
              <h2
                id="trust-heading"
                className="text-3xl font-bold tracking-tight"
              >
                {t("home.trustTitle")}
              </h2>
              <p className="text-muted-foreground">
                {t("home.trustSubtitle")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  icon: Shield,
                  title: t("home.trustZkTitle"),
                  description: t("home.trustZkDesc"),
                },
                {
                  icon: Code2,
                  title: t("home.trustOpenTitle"),
                  description: t("home.trustOpenDesc"),
                  github: true,
                },
                {
                  icon: Scale,
                  title: t("home.trustIrpfTitle"),
                  description: t("home.trustIrpfDesc"),
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-border bg-card p-6 space-y-4"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400"
                    aria-hidden="true"
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                  {item.github && (
                    <a
                      href="https://github.com/jpradanos00/crypto-renta"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      {t("home.viewOnGithub")}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Exchanges compatibles */}
        <section
          className="border-t border-border px-4 py-20"
          aria-labelledby="exchanges-heading"
        >
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="text-center space-y-4">
              <h2
                id="exchanges-heading"
                className="text-3xl font-bold tracking-tight"
              >
                {t("dropzone.exchangesSupported")}
              </h2>
              <p className="text-muted-foreground">
                {t("home.exchangeComingSoon")}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-gain/30 bg-gain/10 px-4 py-2 text-sm font-medium text-gain">
                {t("dropzone.exchangeCoinbase")}{" "}
                <span role="img" aria-label="compatible">
                  ✅
                </span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-4 py-2 text-sm font-medium text-warning">
                {t("dropzone.exchangeBinance")}{" "}
                <span role="img" aria-label="coming soon">
                  🔜
                </span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-4 py-2 text-sm font-medium text-warning">
                {t("dropzone.exchangeKraken")}{" "}
                <span role="img" aria-label="coming soon">
                  🔜
                </span>
              </span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          className="border-t border-border bg-card px-4 py-16"
          aria-labelledby="cta-heading"
        >
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <h2
              id="cta-heading"
              className="text-2xl font-bold tracking-tight"
            >
              {t("home.ctaReady")}
            </h2>
            <p className="text-muted-foreground">{t("home.ctaStart")}</p>
            <Link
              href="/calculadora"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-background"
            >
              {t("home.cta")}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer
          className="border-t border-border px-4 py-8"
          role="contentinfo"
        >
          <div className="mx-auto max-w-5xl flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              {t("home.footerCopyright", { year: CURRENT_YEAR })}
            </p>
            <nav
              className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4"
              aria-label="Footer navigation"
            >
              <a
                href="https://github.com/jpradanos00/crypto-renta"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </a>
              <p className="text-xs text-muted-foreground">
                {t("home.footerDisclaimer")}
              </p>
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}
