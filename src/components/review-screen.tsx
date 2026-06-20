"use client";

import { useAppStore } from "@/store/app-store";
import { formatEUR } from "@/lib/decimal";
import { Send, ArrowDownToLine } from "lucide-react";

export function ReviewScreen() {
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
    d.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (pendingTransactions.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
          Revisa antes de calcular
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
          Se han detectado {sends.length} envío{sends.length === 1 ? "" : "s"} y{" "}
          {unmatchedReceives.length} recepción{unmatchedReceives.length === 1 ? "" : "es"}{" "}
          que necesitan tu confirmación.
        </p>
      </div>

      {/* ── Send classification ── */}
      {sends.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-border bg-muted px-5 py-3.5">
            <Send className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold">
              {sends.length} envío{sends.length === 1 ? "" : "s"} pendiente{sends.length === 1 ? "" : "s"} de clasificar
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="px-4 py-2.5 text-left font-medium">Fecha</th>
                  <th scope="col" className="px-4 py-2.5 text-left font-medium">Activo</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Cantidad</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Valor mercado</th>
                  <th scope="col" className="px-4 py-2.5 text-center font-medium">¿Destino?</th>
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
                            ? "Pago a tercero — genera ganancia/pérdida"
                            : "Wallet propia — no genera hecho imponible"
                        }
                      >
                        {sendDecisions.get(tx.id) === "third-party" ? "Tercero" : "Propia"}
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
              {unmatchedReceives.length} recepción{unmatchedReceives.length === 1 ? "" : "es"} sin origen conocido
            </span>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Estas recepciones no pudieron correlarse con ninguna transferencia
              de origen. Su coste de adquisición usará el <strong>precio de mercado</strong> en
              el momento de recepción.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Si este activo proviene de <strong>otro exchange</strong> o wallet,
              súbelo también como CSV para que la app pueda preservar el coste
              de adquisición real mediante correlación automática.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left font-medium">Fecha</th>
                    <th scope="col" className="px-4 py-2.5 text-left font-medium">Activo</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Cantidad</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Valor mercado</th>
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
