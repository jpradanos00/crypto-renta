import { prepareTransactions, runPipeline } from "@/engine/worker/pipeline";
import type { SanitizedTransaction } from "@/engine/types";
import type { WorkerProgress, WorkerResult } from "@/engine/worker/types";

export function prepareCSVs(csvTexts: string[]): SanitizedTransaction[] {
  return prepareTransactions(csvTexts);
}

export async function processCSVsInMainThread(
  transactions: SanitizedTransaction[],
  sendDecisions: Map<string, "own" | "third-party">,
  onProgress: (p: WorkerProgress) => void
): Promise<WorkerResult> {
  return runPipeline(transactions, sendDecisions, onProgress);
}
