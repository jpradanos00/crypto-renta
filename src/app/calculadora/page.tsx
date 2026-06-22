"use client";

import { useT } from "@/lib/i18n/context";
import { CalculadoraClient } from "@/components/calculadora-client";

export default function CalculadoraPage() {
  const { t } = useT();

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("calculator.title")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("calculator.subtitle")}
          </p>
        </div>
        <CalculadoraClient />
      </div>
    </main>
  );
}
