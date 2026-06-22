"use client";

import Link from "next/link";
import { useState } from "react";
import { LogIn, ExternalLink, FileText, Repeat } from "lucide-react";
import { useT } from "@/lib/i18n/context";

export default function GuiaPage() {
  const { t } = useT();
  const [activeTab, setActiveTab] = useState<"coinbase" | "binance" | "kraken">(
    "coinbase"
  );

  const steps = [
    {
      number: 1,
      title: t("guia.step1Title"),
      icon: LogIn,
      content: (
        <p>
          {t("guia.step1Body")}
        </p>
      ),
    },
    {
      number: 2,
      title: t("guia.step2Title"),
      icon: ExternalLink,
      content: (
        <p>
          {t("guia.step2Body", { link: "" }).split("{link}")[0]}
          <a
            href="https://accounts.coinbase.com/statements"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            accounts.coinbase.com/statements
          </a>
          {t("guia.step2Body", { link: "" }).split("{link}")[1] ?? ""}
        </p>
      ),
    },
    {
      number: 3,
      title: t("guia.step3Title"),
      icon: FileText,
      content: (
        <p>
          {t("guia.step3Body").split('"Transaction history"')[0]}
          &ldquo;Transaction history&rdquo;
          {t("guia.step3Body").split('"Transaction history"')[1] ?? ""}
        </p>
      ),
    },
    {
      number: 4,
      title: t("guia.step4Title"),
      icon: Repeat,
      content: (
        <p>
          {t("guia.step4Body")}
        </p>
      ),
    },
  ];

  const tabs = [
    { id: "coinbase" as const, label: t("guia.tabCoinbase") },
    { id: "binance" as const, label: t("guia.tabBinance") },
    { id: "kraken" as const, label: t("guia.tabKraken") },
  ];

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-12">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("guia.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("guia.subtitle")}
          </p>
        </div>

        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          <p className="font-medium">&#9888;&#65039; {t("guia.warningTitle")}</p>
          <p className="mt-1">
            {t("guia.warningBody")}
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
              <p className="text-muted-foreground">{t("guia.comingSoon")}</p>
            </div>
          )}

          {activeTab === "kraken" && (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">{t("guia.comingSoon")}</p>
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <h2 className="font-medium">{t("guia.compatibleFormats")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("guia.compatibleFormatsDesc")}
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/calculadora"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            {t("guia.cta")} &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
