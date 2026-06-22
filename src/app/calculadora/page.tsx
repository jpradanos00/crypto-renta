"use client";

import { useT } from "@/lib/i18n/context";
import { CalculadoraClient } from "@/components/calculadora-client";

const BREADCRUMB_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "CryptoRenta",
      "item": "https://cryptorenta.app",
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Calculadora",
      "item": "https://cryptorenta.app/calculadora",
    },
  ],
};

export default function CalculadoraPage() {
  const { t } = useT();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(BREADCRUMB_SCHEMA),
        }}
      />
      <main className="min-h-screen px-4 py-12">
        <div className="mx-auto max-w-5xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("calculator.title")}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t("calculator.subtitle")}
            </p>
          </div>
          <CalculadoraClient />
        </div>
      </main>
    </>
  );
}
