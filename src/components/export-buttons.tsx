"use client";

import { useAppStore } from "@/store/app-store";
import { useT } from "@/lib/i18n/context";
import { groupDisposalsByAsset } from "@/lib/fiscal-helpers";
import { ZERO } from "@/lib/decimal";
import { Download, FileText, Coins } from "lucide-react";

export function ExportButtons() {
  const { t } = useT();
  const report = useAppStore((s) => s.report);
  const selectedYear = useAppStore((s) => s.selectedYear);

  if (!report) return null;

  const exportCSV = () => {
    const rows: string[] = [
      [String(selectedYear), "Tax Box", t("export.txtHeader1"), "EUR"].join(";"),
      [String(selectedYear), "1", t("export.txtGains"), report.cubo1.totalGainsEUR.toFixed(2)].join(";"),
      [String(selectedYear), "1", t("export.txtLosses"), report.cubo1.totalLossesEUR.toFixed(2)].join(";"),
      [String(selectedYear), "1", t("export.txtNet"), report.cubo1.netGainLossEUR.toFixed(2)].join(";"),
      [String(selectedYear), "2", t("results.cubo2Title"), report.cubo2.totalIncomeEUR.toFixed(2)].join(";"),
      [String(selectedYear), "3", t("results.cubo3Title"), report.cubo3.totalIncomeEUR.toFixed(2)].join(";"),
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
      [
        String(selectedYear),
        t("assetBreakdown.colAsset"),
        t("assetBreakdown.colTransmission") + " (EUR)",
        t("assetBreakdown.colAcquisition") + " (EUR)",
        t("assetBreakdown.colGainLoss") + " (EUR)",
        t("assetBreakdown.colOps"),
      ].join(";"),
    ];
    for (const b of breakdown) {
      rows.push(
        [
          String(selectedYear),
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
        String(selectedYear),
        t("assetBreakdown.total"),
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
      t("export.txtHeader1"),
      t("export.txtHeader2", { year: selectedYear }),
      "",
      t("export.txtBox1"),
      `  ${t("export.txtGains")}:  ${report.cubo1.totalGainsEUR.toFixed(2)} EUR`,
      `  ${t("export.txtLosses")}:   ${report.cubo1.totalLossesEUR.toFixed(2)} EUR`,
      `  ${t("export.txtNet")}:       ${report.cubo1.netGainLossEUR.toFixed(2)} EUR`,
      "",
      t("export.txtBox2"),
      `  ${t("export.txtTotal")}:      ${report.cubo2.totalIncomeEUR.toFixed(2)} EUR`,
      `  ${t("export.txtOps")}: ${report.cubo2.incomes.length}`,
      "",
      t("export.txtBox3"),
      `  ${t("export.txtTotal")}:      ${report.cubo3.totalIncomeEUR.toFixed(2)} EUR`,
      `  ${t("export.txtOps")}: ${report.cubo3.incomes.length}`,
      "",
      "============================================",
      t("export.txtDisclaimer"),
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
        className="flex items-center gap-1.5 rounded-lg border border-border px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        title={t("export.csvTitle")}
      >
        <Download className="h-3.5 w-3.5" />
        {t("export.csv")}
      </button>
      <button
        onClick={exportAssetCSV}
        className="flex items-center gap-1.5 rounded-lg border border-border px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        title={t("export.assetCsvTitle")}
      >
        <Coins className="h-3.5 w-3.5" />
        {t("export.assetCsv")}
      </button>
      <button
        onClick={exportText}
        className="flex items-center gap-1.5 rounded-lg border border-border px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        title={t("export.txtTitle")}
      >
        <FileText className="h-3.5 w-3.5" />
        {t("export.txt")}
      </button>
    </div>
  );
}
