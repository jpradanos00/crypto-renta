"use client";

import { useMemo } from "react";
import { formatEUR, ZERO } from "@/lib/decimal";
import { groupDisposalsByAsset } from "@/lib/fiscal-helpers";
import type { DisposalEvent } from "@/engine/types";
import { TrendingUp, TrendingDown, Info, Coins } from "lucide-react";
import Decimal from "decimal.js-light";

interface AssetBreakdownTableProps {
  disposals: DisposalEvent[];
  totalGainsEUR: Decimal;
  totalLossesEUR: Decimal;
  netGainLossEUR: Decimal;
}

export function AssetBreakdownTable({
  disposals,
  netGainLossEUR,
}: AssetBreakdownTableProps) {
  const breakdown = useMemo(() => groupDisposalsByAsset(disposals), [disposals]);

  if (breakdown.length === 0) return null;

  // Verify integrity: sum of all breakdowns should equal global totals
  const sumTransmission = breakdown.reduce(
    (acc, b) => acc.plus(b.transmissionValueEUR),
    ZERO
  );
  const sumAcquisition = breakdown.reduce(
    (acc, b) => acc.plus(b.acquisitionValueEUR),
    ZERO
  );
  const sumProfitLoss = breakdown.reduce(
    (acc, b) => acc.plus(b.profitOrLossEUR),
    ZERO
  );

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Coins className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Declaración por moneda
          </h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Copia estos valores exactos añadiendo un nuevo elemento por cada moneda
          en el apartado de <strong>Monedas Virtuales</strong> de Renta Web.
          Si una moneda tiene tanto ventas a EUR como swaps a crypto,
          necesitarás <strong>dos entradas separadas</strong> con distinto tipo
          de contraprestación.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm" role="table" aria-label="Desglose por activo para Renta Web">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
              <th className="pb-2 pr-4 font-medium">Moneda</th>
              <th className="pb-2 px-4 font-medium text-right">
                <span className="hidden sm:inline">Valor de </span>Transmisión
              </th>
              <th className="pb-2 px-4 font-medium text-right">
                <span className="hidden sm:inline">Valor de </span>Adquisición
              </th>
              <th className="pb-2 px-4 font-medium text-right">Ganancia / Pérdida</th>
              <th className="pb-2 pl-4 font-medium text-right" title="Número de ventas y swaps de este activo">Nº ops.</th>
              <th className="pb-2 pl-4 font-medium text-center" title="Tipo de contraprestación recibida a cambio. Indícalo en Renta Web.">Contraprest.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {breakdown.map((item) => {
              const isGain = item.profitOrLossEUR.gte(0);
              const isZero = item.profitOrLossEUR.isZero();
              const Icon = isZero ? null : isGain ? TrendingUp : TrendingDown;

              return (
                <tr key={item.asset} className="group hover:bg-muted/30 transition-colors">
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">
                      {item.asset}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono-nums text-foreground">
                    {formatEUR(item.transmissionValueEUR)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-nums text-muted-foreground">
                    {formatEUR(item.acquisitionValueEUR)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className={`flex items-center justify-end gap-1.5 font-mono-nums font-semibold ${isZero ? "text-muted-foreground" : isGain ? "text-gain" : "text-loss"}`}>
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      <span>{isZero ? "0,00 €" : formatEUR(item.profitOrLossEUR)}</span>
                    </div>
                  </td>
                  <td className="py-3 pl-4 text-right text-xs text-muted-foreground font-mono-nums">
                    {item.transactionsCount}
                  </td>
                  <td className="py-3 pl-4 text-center text-xs font-mono-nums">
                    {item.hasSell && item.hasConvert ? (
                      <span className="text-warning" title="Requiere dos entradas en Renta Web: una para EUR y otra para crypto">EUR + Crypto</span>
                    ) : item.hasSell ? (
                      <span className="text-gain" title="Moneda de curso legal (EUR)">EUR</span>
                    ) : (
                      <span className="text-indigo-400" title="Virtual (otra criptomoneda)">Crypto</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Totals row */}
            <tr className="border-t-2 border-border bg-muted/20 font-semibold">
              <td className="py-3 pr-4 text-foreground">TOTAL</td>
              <td className="py-3 px-4 text-right font-mono-nums text-foreground">
                {formatEUR(sumTransmission)}
              </td>
              <td className="py-3 px-4 text-right font-mono-nums text-muted-foreground">
                {formatEUR(sumAcquisition)}
              </td>
              <td className="py-3 px-4 text-right">
                <div className={`flex items-center justify-end gap-1.5 font-mono-nums ${netGainLossEUR.gte(0) ? "text-gain" : "text-loss"}`}>
                  {netGainLossEUR.gte(0) ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  <span>{formatEUR(netGainLossEUR)}</span>
                </div>
              </td>
              <td className="py-3 pl-4 text-right text-xs text-muted-foreground font-mono-nums">
                {disposals.length}
              </td>
              <td className="py-3 pl-4" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Integrity check */}
      {sumProfitLoss.minus(netGainLossEUR).abs().gte(1e-12) && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          <p className="text-xs text-warning">
            Advertencia: la suma del desglose no coincide con el total global.
            Diferencia: {formatEUR(sumProfitLoss.minus(netGainLossEUR))}
          </p>
        </div>
      )}
    </div>
  );
}
