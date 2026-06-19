import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { WarningPanel } from "@/components/warning-panel";
import { useAppStore } from "@/store/app-store";
import { d } from "@/lib/decimal";
import type { FiscalYearReport } from "@/engine/types";

describe("WarningPanel", () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState ? useAppStore.getInitialState() : {
      csvFiles: [], rawTransactions: [], status: "idle", progress: { phase: "", percent: 0 },
      selectedYear: new Date().getFullYear() - 1, report: null, reports: new Map(),
      availableYears: [], fullHistory: null, errors: [],
    });
  });

  it("is hidden when status is not done", () => {
    useAppStore.setState({ status: "idle" });
    const { container } = render(<WarningPanel />);
    expect(container.firstChild).toBeNull();
  });

  it("is hidden when no warnings", () => {
    const report: FiscalYearReport = {
      year: 2024,
      cubo1: { disposals: [], totalGainsEUR: d("0"), totalLossesEUR: d("0"), netGainLossEUR: d("0") },
      cubo2: { incomes: [], totalIncomeEUR: d("0") },
      cubo3: { incomes: [], totalIncomeEUR: d("0") },
      allTransactions: [],
      warnings: [],
    };
    useAppStore.setState({ status: "done", report });
    const { container } = render(<WarningPanel />);
    expect(container.firstChild).toBeNull();
  });

  it("renders warnings count", () => {
    const report: FiscalYearReport = {
      year: 2024,
      cubo1: { disposals: [], totalGainsEUR: d("0"), totalLossesEUR: d("0"), netGainLossEUR: d("0") },
      cubo2: { incomes: [], totalIncomeEUR: d("0") },
      cubo3: { incomes: [], totalIncomeEUR: d("0") },
      allTransactions: [],
      warnings: [
        { transactionId: "tx-1", code: "INSUFFICIENT_LOTS", message: "Not enough lots" },
      ],
    };
    useAppStore.setState({ status: "done", report });
    render(<WarningPanel />);
    expect(screen.getByText(/1 advertencia detectada/i)).toBeInTheDocument();
    expect(screen.getByText(/Faltan lotes \(probablemente por redondeo del exchange\)/i)).toBeInTheDocument();
    expect(screen.getByText("Not enough lots")).toBeInTheDocument();
  });
});
