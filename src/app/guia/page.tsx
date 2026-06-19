"use client";

import Link from "next/link";
import { useState } from "react";
import { LogIn, ExternalLink, Settings, Repeat } from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Inicia sesión en tu cuenta de Coinbase",
    icon: LogIn,
    content: (
      <p>
        Abre tu navegador y accede a tu cuenta de Coinbase. Asegúrate de usar
        las credenciales correctas.
      </p>
    ),
  },
  {
    number: 2,
    title: "Ve a Statements",
    icon: ExternalLink,
    content: (
      <p>
        Dirígete a{" "}
        <a
          href="https://accounts.coinbase.com/statements"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          accounts.coinbase.com/statements
        </a>
        .
      </p>
    ),
  },
  {
    number: 3,
    title: "Selecciona Transaction history, formato CSV, y el rango de fechas",
    icon: Settings,
    content: (
      <p>
        En la página de statements, selecciona "Transaction history". Asegúrate
        de elegir el formato <strong>CSV</strong> y el rango de fechas
        completo.
      </p>
    ),
  },
  {
    number: 4,
    title: "Descarga y repite para todos los años",
    icon: Repeat,
    content: (
      <p>
        Descarga el archivo CSV. Repite el proceso para cada año en el que
        hayas tenido operaciones con criptomonedas.
      </p>
    ),
  },
];

export default function GuiaPage() {
  const [activeTab, setActiveTab] = useState<"coinbase" | "binance" | "kraken">(
    "coinbase"
  );

  const tabs = [
    { id: "coinbase" as const, label: "Coinbase" },
    { id: "binance" as const, label: "Binance" },
    { id: "kraken" as const, label: "Kraken" },
  ];

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-12">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Cómo descargar tu historial de transacciones
          </h1>
          <p className="text-muted-foreground">
            Guía paso a paso para obtener tu historial de transacciones.
          </p>
        </div>

        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          <p className="font-medium">&#9888;&#65039; Importante</p>
          <p className="mt-1">
            Procesa TODOS tus CSVs históricos de todos los exchanges para que
            el cálculo FIFO sea correcto. Si solo subes un año, el coste de
            adquisición podría ser incompleto.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex space-x-1 rounded-lg bg-muted p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "coinbase" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {steps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.number}
                      className="relative flex gap-4 rounded-lg border border-border bg-card p-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {step.number}
                          </span>
                          <h3 className="font-medium text-sm leading-tight">
                            {step.title}
                          </h3>
                        </div>
                        <div className="text-sm text-muted-foreground leading-relaxed">
                          {step.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="aspect-video w-full overflow-hidden rounded-lg border border-border">
                <iframe
                  className="h-full w-full"
                  src="https://www.youtube-nocookie.com/embed/Q-HwWJrXrvQ"
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {activeTab === "binance" && (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">Próximamente</p>
            </div>
          )}

          {activeTab === "kraken" && (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">Próximamente</p>
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <h2 className="font-medium">Formatos compatibles</h2>
          <p className="text-sm text-muted-foreground">
            Actualmente compatible con CSV de Coinbase. Próximamente: Binance,
            Kraken.
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/calculadora"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            Ir a la Calculadora &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
