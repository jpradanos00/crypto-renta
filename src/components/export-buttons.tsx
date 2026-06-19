"use client";

import { useAppStore } from "@/store/app-store";
import { groupDisposalsByAsset } from "@/lib/fiscal-helpers";
import { ZERO } from "@/lib/decimal";
import { Download, FileText, Coins } from "lucide-react";

export function ExportButtons() {
  const report = useAppStore((s) => s.report);
  const selectedYear = useAppStore((s) => s.selectedYear);

  if (!report) return null;

  const exportCSV = () => {
    const rows: string[] = [
      ["Año", "Tax Box", "Concepto", "Importe EUR"].join(";"),
      [selectedYear, "1", "Ganancias", report.cubo1.totalGainsEUR.toFixed(2)].join(";"),
      [selectedYear, "1", "Pérdidas", report.cubo1.totalLossesEUR.toFixed(2)].join(";"),
      [selectedYear, "1", "Neto", report.cubo1.netGainLossEUR.toFixed(2)].join(";"),
      [selectedYear, "2", "Rendimientos", report.cubo2.totalIncomeEUR.toFixed(2)].join(";"),
      [selectedYear, "3", "Otras ganancias", report.cubo3.totalIncomeEUR.toFixed(2)].join(";"),
    ];

    const blob = new Blob(["\uFEFF" + rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cryptorenta_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAssetCSV = () => {
    const breakdown = groupDisposalsByAsset(report.cubo1.disposals);
    const rows: string[] = [
      ["Año", "Moneda", "Valor de Transmisión (EUR)", "Valor de Adquisición (EUR)", "Ganancia/Pérdida (EUR)", "Operaciones"].join(";"),
    ];
    for (const b of breakdown) {
      rows.push(
        [
          selectedYear,
          b.asset,
          b.transmissionValueEUR.toFixed(2),
          b.acquisitionValueEUR.toFixed(2),
          b.profitOrLossEUR.toFixed(2),
          b.transactionsCount,
        ].join(";")
      );
    }
    // Totals row
    const totalTransmission = report.cubo1.disposals.reduce(
      (acc, d) => acc.plus(d.proceedsEUR),
      ZERO
    );
    const totalAcquisition = report.cubo1.disposals.reduce(
      (acc, d) => acc.plus(d.costBasisEUR),
      ZERO
    );
    rows.push(
      [
        selectedYear,
        "TOTAL",
        totalTransmission.toFixed(2),
        totalAcquisition.toFixed(2),
        report.cubo1.netGainLossEUR.toFixed(2),
        report.cubo1.disposals.length,
      ].join(";")
    );

    const blob = new Blob(["\uFEFF" + rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cryptorenta_desglose_monedas_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportText = () => {
    const lines = [
      "Informe para la declaración del IRPF España (AEAT)",
      `=== CryptoRenta · Informe Fiscal ${selectedYear} ===`,
      "",
      "BOX 1 - Ganancias/Pérdidas Patrimoniales (Casillas 1800-1814)",
      `  Ganancias:  ${report.cubo1.totalGainsEUR.toFixed(2)} EUR`,
      `  Pérdidas:   ${report.cubo1.totalLossesEUR.toFixed(2)} EUR`,
      `  NETO:       ${report.cubo1.netGainLossEUR.toFixed(2)} EUR`,
      "",
      "BOX 2 - Rendimientos del Capital Mobiliario (Casilla 0027)",
      `  Total:      ${report.cubo2.totalIncomeEUR.toFixed(2)} EUR`,
      `  Operaciones: ${report.cubo2.incomes.length}`,
      "",
      "BOX 3 - Otras Ganancias (Casillas 0304+)",
      `  Total:      ${report.cubo3.totalIncomeEUR.toFixed(2)} EUR`,
      `  Operaciones: ${report.cubo3.incomes.length}`,
      "",
      "============================================",
      "Esta herramienta es informativa. Consulta con un asesor fiscal.",
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cryptorenta_${selectedYear}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportCSV}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        title="Descargar como CSV"
      >
        <Download className="h-3.5 w-3.5" />
        CSV
      </button>
      <button
        onClick={exportAssetCSV}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        title="Descargar desglose por moneda"
      >
        <Coins className="h-3.5 w-3.5" />
        Por moneda
      </button>
      <button
        onClick={exportText}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        title="Descargar como texto"
      >
        <FileText className="h-3.5 w-3.5" />
        TXT
      </button>
    </div>
  );
}
