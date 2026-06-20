import { parseCoinbaseCSV } from "@/engine/parser/coinbase";
import { sanitizeTransactions } from "@/engine/parser/sanitizer";
import { FIFOEngine } from "@/engine/fifo/engine";
import { buildFiscalYearReports } from "@/engine/fiscal/reporter";
import type { CoinbaseRawRow, SanitizedTransaction } from "@/engine/types";
import type { WorkerProgress, WorkerResult } from "@/engine/worker/types";

/**
 * Paso rápido: parsea, sanitiza, deduplica y ordena las transacciones.
 * Se usa antes de la pantalla de revisión para que el usuario pueda
 * clasificar envíos antes de lanzar el FIFO.
 */
export function prepareTransactions(
  csvTexts: string[]
): SanitizedTransaction[] {
  const allRawRows: CoinbaseRawRow[] = [];
  for (const text of csvTexts) {
    const rows = parseCoinbaseCSV(text);
    allRawRows.push(...rows);
  }

  let transactions = sanitizeTransactions(allRawRows);

  const seen = new Set<string>();
  transactions = transactions.filter((tx) => {
    if (seen.has(tx.id)) return false;
    seen.add(tx.id);
    return true;
  });

  transactions.sort(
    (a, b) =>
      a.timestamp.getTime() - b.timestamp.getTime() ||
      a.id.localeCompare(b.id)
  );

  return transactions;
}

/**
 * Pipeline fiscal completo: FIFO + clasificación + reporte.
 * Recibe transacciones ya sanitizadas y las decisiones del usuario
 * sobre qué envíos son a terceros.
 */
export async function runPipeline(
  transactions: SanitizedTransaction[],
  sendDecisions: Map<string, "own" | "third-party">,
  onProgress: (progress: WorkerProgress) => void
): Promise<WorkerResult> {
  onProgress({
    phase: "computing_fifo",
    percent: 40,
    message: "Calculando FIFO...",
  });

  const engine = new FIFOEngine(sendDecisions);
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
