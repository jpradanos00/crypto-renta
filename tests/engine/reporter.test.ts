import { describe, it, expect } from "vitest";
import { d } from "@/lib/decimal";
import type {
  DisposalEvent,
  IncomeEvent,
} from "@/engine/types";
import { buildFiscalYearReports, buildFiscalYearReport } from "@/engine/fiscal/reporter";
import type { SanitizedTransaction, CalculationWarning } from "@/engine/types";

function makeDisposal(
  year: number,
  gainLossEUR: string,
  overrides?: Partial<DisposalEvent>
): DisposalEvent {
  const ts = new Date(`${year}-06-15T00:00:00Z`);
  return {
    transactionId: `disp-${year}-${Math.random().toString(36).slice(2)}`,
    timestamp: ts,
    asset: "BTC",
    quantityDisposed: d("1"),
    proceedsEUR: d("0"),
    costBasisEUR: d("0"),
    gainLossEUR: d(gainLossEUR),
    lotsConsumed: [],
    type: "Sell",
    ...overrides,
  };
}

function makeIncome(
  year: number,
  cubo: 2 | 3,
  fairMarketValueEUR: string,
  category: IncomeEvent["category"]
): IncomeEvent {
  const ts = new Date(`${year}-06-15T00:00:00Z`);
  return {
    transactionId: `inc-${year}-${Math.random().toString(36).slice(2)}`,
    timestamp: ts,
    asset: "ADA",
    quantity: d("1"),
    fairMarketValueEUR: d(fairMarketValueEUR),
    cubo,
    category,
  };
}

describe("buildFiscalYearReports", () => {
  describe("Agrupación por año", () => {
    it("disposal en 2024-12-31 22:00 UTC (23:00 España) va al reporte 2024", () => {
      const disposal = makeDisposal(2024, "1000");
      // 22:00 UTC = 23:00 CET (España en invierno) => aún 2024
      disposal.timestamp = new Date("2024-12-31T22:00:00Z");

      const reports = buildFiscalYearReports(
        [disposal],
        [],
        [],
        []
      );

      expect(reports.has(2024)).toBe(true);
      expect(reports.has(2025)).toBe(false);
      expect(reports.get(2024)!.cubo1.disposals.length).toBe(1);
    });

    it("disposal en 2024-12-31 23:30 UTC (00:30 España) va al reporte 2025", () => {
      const disposal = makeDisposal(2024, "1000");
      // 23:30 UTC = 00:30 CET (España en invierno) => ya es 2025
      disposal.timestamp = new Date("2024-12-31T23:30:00Z");

      const reports = buildFiscalYearReports(
        [disposal],
        [],
        [],
        []
      );

      expect(reports.has(2025)).toBe(true);
      expect(reports.has(2024)).toBe(false);
      expect(reports.get(2025)!.cubo1.disposals.length).toBe(1);
    });

    it("disposal en 2025-01-01 va al reporte 2025", () => {
      const disposal = makeDisposal(2025, "500");
      disposal.timestamp = new Date("2025-01-01T00:00:00Z");

      const reports = buildFiscalYearReports(
        [disposal],
        [],
        [],
        []
      );

      expect(reports.has(2025)).toBe(true);
      expect(reports.get(2025)!.cubo1.disposals.length).toBe(1);
    });
  });

  describe("Sumas", () => {
    it("totalGainsEUR, totalLossesEUR y netGainLossEUR suman correctamente", () => {
      const disposals: DisposalEvent[] = [
        makeDisposal(2024, "1000"),
        makeDisposal(2024, "-200"),
        makeDisposal(2024, "500"),
        makeDisposal(2024, "-50"),
      ];

      const reports = buildFiscalYearReports(disposals, [], [], []);
      const report = reports.get(2024)!;

      expect(report.cubo1.totalGainsEUR.toString()).toBe("1500");
      expect(report.cubo1.totalLossesEUR.toString()).toBe("250");
      expect(report.cubo1.netGainLossEUR.toString()).toBe("1250");
    });

    it("un año sin disposals tiene totales a cero", () => {
      const reports = buildFiscalYearReports([], [], [], []);
      expect(reports.size).toBe(0);
    });
  });

  describe("Cubo 2 y 3", () => {
    it("agrupa ingresos de cubo 2 y cubo 3 por separado", () => {
      const incomes: IncomeEvent[] = [
        makeIncome(2024, 2, "100", "staking"),
        makeIncome(2024, 2, "50", "reward_income"),
        makeIncome(2024, 3, "200", "coinbase_earn"),
        makeIncome(2024, 3, "150", "airdrop"),
      ];

      const reports = buildFiscalYearReports([], incomes, [], []);
      const report = reports.get(2024)!;

      expect(report.cubo2.incomes.length).toBe(2);
      expect(report.cubo2.totalIncomeEUR.toString()).toBe("150");

      expect(report.cubo3.incomes.length).toBe(2);
      expect(report.cubo3.totalIncomeEUR.toString()).toBe("350");
    });
  });
});

describe("buildFiscalYearReport", () => {
  it("returns a single-year report with correct sums", () => {
    const disposals: DisposalEvent[] = [
      makeDisposal(2024, "1000"),
      makeDisposal(2024, "-200"),
      makeDisposal(2023, "500"),
    ];
    const incomes: IncomeEvent[] = [
      makeIncome(2024, 2, "100", "staking"),
      makeIncome(2024, 3, "50", "airdrop"),
      makeIncome(2023, 2, "30", "reward_income"),
    ];
    const transactions: SanitizedTransaction[] = [];
    const warnings: CalculationWarning[] = [
      { transactionId: "t1", code: "INSUFFICIENT_LOTS", message: "test" },
    ];

    const report = buildFiscalYearReport(2024, disposals, incomes, transactions, warnings);

    expect(report.year).toBe(2024);
    expect(report.cubo1.disposals.length).toBe(2);
    expect(report.cubo1.totalGainsEUR.toString()).toBe("1000");
    expect(report.cubo1.totalLossesEUR.toString()).toBe("200");
    expect(report.cubo1.netGainLossEUR.toString()).toBe("800");

    expect(report.cubo2.incomes.length).toBe(1);
    expect(report.cubo2.totalIncomeEUR.toString()).toBe("100");

    expect(report.cubo3.incomes.length).toBe(1);
    expect(report.cubo3.totalIncomeEUR.toString()).toBe("50");

    expect(report.allTransactions).toBe(transactions);
    expect(report.warnings).toBe(warnings);
  });

  it("returns zeroes for a year with no data", () => {
    const report = buildFiscalYearReport(2025, [], [], [], []);
    expect(report.year).toBe(2025);
    expect(report.cubo1.totalGainsEUR.toString()).toBe("0");
    expect(report.cubo1.totalLossesEUR.toString()).toBe("0");
    expect(report.cubo1.netGainLossEUR.toString()).toBe("0");
    expect(report.cubo2.totalIncomeEUR.toString()).toBe("0");
    expect(report.cubo3.totalIncomeEUR.toString()).toBe("0");
  });
});
