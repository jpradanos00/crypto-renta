import {
  FIFOEngine,
} from "@/engine/fifo/engine";
import type {
  SanitizedTransaction,
  DisposalEvent,
  CostBasisLot,
  CalculationWarning,
  IncomeEvent,
} from "@/engine/types";

export function computeFIFO(
  transactions: SanitizedTransaction[]
): {
  portfolioSnapshot: Map<string, CostBasisLot[]>;
  allDisposals: DisposalEvent[];
  allIncomes: IncomeEvent[];
  disposals: DisposalEvent[];
  warnings: CalculationWarning[];
} {
  const engine = new FIFOEngine();
  for (const tx of transactions) {
    engine.processTransaction(tx);
  }
  return {
    portfolioSnapshot: engine.getPortfolioSnapshot(),
    allDisposals: engine.getDisposals(),
    allIncomes: engine.getIncomes(),
    disposals: engine.getDisposals(),
    warnings: engine.getWarnings(),
  };
}
