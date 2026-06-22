"use client";

import { useAppStore } from "@/store/app-store";
import { useT } from "@/lib/i18n/context";
import { formatEUR } from "@/lib/decimal";
import { Send, ArrowDownToLine } from "lucide-react";

export function ReviewScreen() {
  const { t, locale } = useT();
  const pendingTransactions = useAppStore((s) => s.pendingTransactions);
  const sendDecisions = useAppStore((s) => s.sendDecisions);
  const toggleSendDecision = useAppStore((s) => s.toggleSendDecision);

  const sends = pendingTransactions.filter((tx) => tx.type === "Send");
  const unmatchedReceives = pendingTransactions.filter(
    (tx) =>
      tx.type === "Receive" &&
      tx.senderAddress &&
      (tx.senderAddress.includes("external") || tx.senderAddress.includes("an external"))
  );

  const formatDate = (d: Date) =>
    d.toLocaleDateString(locale === "en" ? "en-US" : "es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (pendingTransactions.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
          {t("review.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
          {t("review.subtitle", {
            sends: sends.length,
            sendsPlural: sends.length === 1 ? "" : "s",
            receives: unmatchedReceives.length,
            receivesPlural: unmatchedReceives.length === 1 ? "" : "es",
          })}
        </p>
      </div>

      {/* ── Send classification ── */}
      {sends.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-border bg-muted px-5 py-3.5">
            <Send className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold">
              {t("review.sendHeader", {
                count: sends.length,
                countPlural: sends.length === 1 ? "" : "s",
                countPlural2: sends.length === 1 ? "" : "s",
              })}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="px-4 py-2.5 text-left font-medium">{t("review.colDate")}</th>
                  <th scope="col" className="px-4 py-2.5 text-left font-medium">{t("review.colAsset")}</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">{t("review.colQuantity")}</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">{t("review.colMarketValue")}</th>
                  <th scope="col" className="px-4 py-2.5 text-center font-medium">{t("review.colDestination")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sends.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDate(tx.timestamp)}
                    </td>
                    <td className="px-4 py-3 font-medium">{tx.asset}</td>
                    <td className="px-4 py-3 text-right font-mono-nums">
                      {tx.quantity.toString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-nums text-muted-foreground">
                      {formatEUR(tx.subtotal.abs())}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleSendDecision(tx.id)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          sendDecisions.get(tx.id) === "third-party"
                            ? "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30"
                            : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                        }`}
                        title={
                          sendDecisions.get(tx.id) === "third-party"
                            ? t("review.thirdPartyTooltip")
                            : t("review.ownTooltip")
                        }
                      >
                        {sendDecisions.get(tx.id) === "third-party" ? t("review.thirdParty") : t("review.own")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Unmatched receives ── */}
      {unmatchedReceives.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-border bg-muted px-5 py-3.5">
            <ArrowDownToLine className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-semibold">
              {t("review.unmatchedHeader", {
                count: unmatchedReceives.length,
                countPlural: unmatchedReceives.length === 1 ? "" : "es",
              })}
            </span>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("review.unmatchedDesc1")}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("review.unmatchedDesc2")}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left font-medium">{t("review.colDate")}</th>
                    <th scope="col" className="px-4 py-2.5 text-left font-medium">{t("review.colAsset")}</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">{t("review.colQuantity")}</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">{t("review.colMarketValue")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {unmatchedReceives.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {formatDate(tx.timestamp)}
                      </td>
                      <td className="px-4 py-3 font-medium">{tx.asset}</td>
                      <td className="px-4 py-3 text-right font-mono-nums">
                        {tx.quantity.toString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-nums text-muted-foreground">
                        {formatEUR(tx.subtotal.abs())}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
