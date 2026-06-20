import type {
  CalculationWarning,
  CostBasisLot,
  FiscalYearReport,
} from "@/engine/types";

export interface WorkerProgress {
  phase: "parsing" | "sanitizing" | "building_lots" | "computing_fifo" | "classifying";
  percent: number;
  message: string;
}

export interface WorkerResult {
  success: boolean;
  reports: Map<number, FiscalYearReport>;
  availableYears: number[];
  globalWarnings: CalculationWarning[];
  portfolioSnapshot: Map<string, CostBasisLot[]>;
}

export interface CryptoRentaWorker {
  processCSVs(
    csvTexts: string[],
    sendDecisions: Map<string, "own" | "third-party">,
    onProgress: (progress: WorkerProgress) => void
  ): Promise<WorkerResult>;
}
