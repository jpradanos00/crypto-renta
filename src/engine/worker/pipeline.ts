import { parseCoinbaseCSV } from "@/engine/parser/coinbase";
import { sanitizeTransactions } from "@/engine/parser/sanitizer";
import { FIFOEngine } from "@/engine/fifo/engine";
import { buildFiscalYearReports } from "@/engine/fiscal/reporter";
import type { CoinbaseRawRow } from "@/engine/types";
import type { WorkerProgress, WorkerResult } from "@/engine/worker/types";

export async function runPipeline(
  csvTexts: string[],
  onProgress: (progress: WorkerProgress) => void
): Promise<WorkerResult> {
  onProgress({ phase: "parsing", percent: 0, message: "Parseando CSVs..." });
  const allRawRows: CoinbaseRawRow[] = [];
  for (const text of csvTexts) {
    const rows = parseCoinbaseCSV(text);
    allRawRows.push(...rows);
  }

  onProgress({
    phase: "sanitizing",
    percent: 20,
    message: "Sanitizando transacciones...",
  });
  let transactions = sanitizeTransactions(allRawRows);

  // Deduplicate by transaction ID
  const seen = new Set<string>();
  transactions = transactions.filter((tx) => {
    if (seen.has(tx.id)) return false;
    seen.add(tx.id);
    return true;
  });

  onProgress({
    phase: "building_lots",
    percent: 40,
    message: "Ordenando cronológicamente...",
  });

  // Ordenar por fecha ascendente (FIFO necesita orden cronológico)
  transactions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime() || a.id.localeCompare(b.id));

  onProgress({
    phase: "computing_fifo",
    percent: 50,
    message: "Calculando FIFO...",
  });

  const engine = new FIFOEngine();
  for (const tx of transactions) {
    engine.processTransaction(tx);
  }

  onProgress({
    phase: "computing_fifo",
    percent: 60,
    message: "Calculando FIFO...",
  });

  const disposals = engine.getDisposals();
  const incomes = engine.getIncomes();
  const warnings = engine.getWarnings();

  onProgress({
    phase: "classifying",
    percent: 80,
    message: "Clasificando...",
  });

  const reports = buildFiscalYearReports(
    disposals,
    incomes,
    transactions,
    warnings
  );

  const availableYears = Array.from(reports.keys()).sort((a, b) => a - b);

  return {
    success: true,
    reports,
    availableYears,
    globalWarnings: warnings,
    portfolioSnapshot: engine.getPortfolioSnapshot(),
  };
}
