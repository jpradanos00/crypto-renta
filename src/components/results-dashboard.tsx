"use client";

import { useAppStore } from "@/store/app-store";
import { formatEUR } from "@/lib/decimal";
import { AssetBreakdownTable } from "@/components/asset-breakdown-table";
import { TrendingUp, TrendingDown, Minus, BarChart3, Wallet, Sparkles } from "lucide-react";

function CubeCard({
  title,
  casilla,
  base,
  amount,
  description,
  icon: Icon,
  colorClass,
}: {
  title: string;
  casilla: string;
  base: string;
  amount: import("decimal.js-light").default;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}) {
  const isPositive = amount.gte(0);
  const isZero = amount.isZero();
  const AmountIcon = isZero ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorClass} bg-opacity-10`}>
            <Icon className={`h-5 w-5 ${colorClass.replace("bg-", "text-")}`} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{casilla}</p>
            <h3 className="mt-0.5 text-sm font-semibold">{title}</h3>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {base}
        </span>
      </div>

      <div className={`flex items-center gap-2 ${isZero ? "text-muted-foreground" : isPositive ? "text-gain" : "text-loss"}`}>
        <AmountIcon className="h-5 w-5 shrink-0" />
        <span className="text-2xl font-bold tabular-nums font-mono-nums">
          {isZero ? "0,00 €" : formatEUR(amount)}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export function ResultsDashboard() {
  const report = useAppStore((s) => s.report);
  const status = useAppStore((s) => s.status);

  if (status !== "done") return null;

  if (!report) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <BarChart3 className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold">Sin datos para este año</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          No se encontraron operaciones en el año fiscal seleccionado. Prueba con otro año.
        </p>
      </div>
    );
  }

  const c1 = report.cubo1;
  const c2 = report.cubo2;
  const c3 = report.cubo3;

  return (
    <div className="space-y-6" role="region" aria-label="Resumen fiscal por apartados">
      <p className="text-xs text-muted-foreground">
        Resultados para la declaración del IRPF en España (AEAT)
      </p>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
        <CubeCard
          title="Ganancias/Pérdidas Patrimoniales"
          casilla="Casillas 1800–1814"
          base="Base del Ahorro"
          amount={c1.netGainLossEUR}
          description="Ventas y swaps de criptomonedas. Método FIFO por activo."
          icon={BarChart3}
          colorClass="bg-primary"
        />
        <CubeCard
          title="Rendimientos del Capital (Staking)"
          casilla="Casilla 0027"
          base="Base del Ahorro"
          amount={c2.totalIncomeEUR}
          description="Intereses y recompensas de staking recibidos durante el ejercicio."
          icon={Wallet}
          colorClass="bg-gain"
        />
        <CubeCard
          title="Otras Ganancias (Airdrops)"
          casilla="Casillas 0304+"
          base="Base General"
          amount={c3.totalIncomeEUR}
          description="Airdrops y recompensas. Valor de mercado en el momento de recepción."
          icon={Sparkles}
          colorClass="bg-warning"
        />
      </div>

      <div className="border-l-4 border-primary rounded-xl space-y-6">
        {/* Neto detallado Cubo 1 */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Desglose Ganancias/Pérdidas Patrimoniales
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Ganancias</p>
              <p className="text-lg font-bold text-gain font-mono-nums">{formatEUR(c1.totalGainsEUR)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pérdidas</p>
              <p className="text-lg font-bold text-loss font-mono-nums">{formatEUR(c1.totalLossesEUR)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Neto</p>
              <p className={`text-lg font-bold font-mono-nums ${c1.netGainLossEUR.gte(0) ? "text-gain" : "text-loss"}`}>
                {formatEUR(c1.netGainLossEUR)}
              </p>
            </div>
          </div>
        </div>

        {/* Desglose por moneda para Renta Web */}
        <AssetBreakdownTable
          disposals={c1.disposals}
          totalGainsEUR={c1.totalGainsEUR}
          totalLossesEUR={c1.totalLossesEUR}
          netGainLossEUR={c1.netGainLossEUR}
        />
      </div>
    </div>
  );
}
