import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultsDashboard } from "@/components/results-dashboard";
import { useAppStore } from "@/store/app-store";
import { d } from "@/lib/decimal";
import type { FiscalYearReport } from "@/engine/types";

function makeReport(overrides?: Partial<FiscalYearReport>): FiscalYearReport {
  return {
    year: 2024,
    cubo1: {
      disposals: [],
      totalGainsEUR: d("1500"),
      totalLossesEUR: d("300"),
      netGainLossEUR: d("1200"),
    },
    cubo2: {
      incomes: [],
      totalIncomeEUR: d("250"),
    },
    cubo3: {
      incomes: [],
      totalIncomeEUR: d("100"),
    },
    allTransactions: [],
    warnings: [],
    ...overrides,
  };
}

describe("ResultsDashboard", () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState ? useAppStore.getInitialState() : {
      csvFiles: [], rawTransactions: [], status: "idle", progress: { phase: "", percent: 0 },
      selectedYear: new Date().getFullYear() - 1, report: null, reports: new Map(),
      availableYears: [], fullHistory: null, errors: [],
    });
  });

  it("is hidden when status is not done", () => {
    useAppStore.setState({ status: "idle" });
    const { container } = render(<ResultsDashboard />);
    expect(container.firstChild).toBeNull();
  });

  it("shows empty state when report is null", () => {
    useAppStore.setState({ status: "done", report: null });
    render(<ResultsDashboard />);
    expect(screen.getByText(/Sin datos para este año/i)).toBeInTheDocument();
  });

  it("renders three cards with correct values", () => {
    useAppStore.setState({ status: "done", report: makeReport() });
    render(<ResultsDashboard />);
    expect(screen.getAllByText(/Ganancias\/Pérdidas Patrimoniales/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Rendimientos del Capital/i)).toBeInTheDocument();
    expect(screen.getByText(/Otras Ganancias/i)).toBeInTheDocument();

    expect(screen.getByText("€1500.00")).toBeInTheDocument();
    expect(screen.getByText("€300.00")).toBeInTheDocument();
    expect(screen.getAllByText("€1200.00").length).toBeGreaterThan(0);
    expect(screen.getByText("€250.00")).toBeInTheDocument();
    expect(screen.getByText("€100.00")).toBeInTheDocument();
  });
});
