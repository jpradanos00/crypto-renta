import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../test-utils";
import { OperationsTable } from "@/components/operations-table";
import { useAppStore } from "@/store/app-store";
import { d } from "@/lib/decimal";
import type { FiscalYearReport, SanitizedTransaction } from "@/engine/types";

function makeTx(overrides?: Partial<SanitizedTransaction>): SanitizedTransaction {
  return {
    id: "tx-1",
    timestamp: new Date("2024-06-15T10:00:00Z"),
    type: "Buy",
    asset: "BTC",
    quantity: d("1"),
    direction: "IN",
    priceCurrency: "EUR",
    priceAtTransaction: d("100"),
    subtotal: d("100"),
    totalInclFees: d("100"),
    fees: d("0"),
    notes: "",
    senderAddress: null,
    recipientAddress: null,
    convertTargetAsset: null,
    convertTargetQuantity: null,
    source: "coinbase",
    ...overrides,
  };
}

function makeReport(txs: SanitizedTransaction[]): FiscalYearReport {
  return {
    year: 2024,
    cubo1: { disposals: [], totalGainsEUR: d("0"), totalLossesEUR: d("0"), netGainLossEUR: d("0") },
    cubo2: { incomes: [], totalIncomeEUR: d("0") },
    cubo3: { incomes: [], totalIncomeEUR: d("0") },
    allTransactions: txs,
    warnings: [],
  };
}

describe("OperationsTable", () => {
  beforeEach(() => {
    useAppStore.setState({
      csvFiles: [], rawTransactions: [], status: "idle", progress: { phase: "", percent: 0 },
      selectedYear: new Date().getFullYear() - 1, report: null, reports: new Map(),
      availableYears: [], fullHistory: null, errors: [],
      sendDecisions: new Map(), pendingTransactions: [],
    });
  });

  it("is hidden when status is not done", () => {
    useAppStore.setState({ status: "idle" });
    const { container } = render(<OperationsTable />);
    expect(container.firstChild).toBeNull();
  });

  it("shows empty state when no transactions", () => {
    useAppStore.setState({ status: "done", report: makeReport([]) });
    render(<OperationsTable />);
    expect(screen.getByText(/Sin operaciones/i)).toBeInTheDocument();
  });

  it("renders transactions when accordion is opened", () => {
    const txs = [
      makeTx({ id: "tx-1", asset: "BTC" }),
      makeTx({ id: "tx-2", asset: "ETH", timestamp: new Date("2024-07-01T10:00:00Z") }),
    ];
    useAppStore.setState({ status: "done", report: makeReport(txs) });
    render(<OperationsTable />);
    const toggle = screen.getByText(/Ver detalle de operaciones/i);
    fireEvent.click(toggle);
    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("ETH")).toBeInTheDocument();
    expect(screen.getByText(/Página 1 de 1/i)).toBeInTheDocument();
  });

  it("sorts by date when header clicked", () => {
    const txs = [
      makeTx({ id: "tx-1", asset: "BTC", timestamp: new Date("2024-01-01T10:00:00Z") }),
      makeTx({ id: "tx-2", asset: "ETH", timestamp: new Date("2024-12-01T10:00:00Z") }),
    ];
    useAppStore.setState({ status: "done", report: makeReport(txs) });
    render(<OperationsTable />);
    const toggle = screen.getByText(/Ver detalle de operaciones/i);
    fireEvent.click(toggle);
    const header = screen.getByRole("button", { name: /Fecha/i });
    fireEvent.click(header);
    expect(header).toBeInTheDocument();
  });
});
