import { runPipeline } from "@/engine/worker/pipeline";
import type { WorkerProgress, WorkerResult } from "@/engine/worker/types";

export async function processCSVsInMainThread(
  csvTexts: string[],
  onProgress: (p: WorkerProgress) => void
): Promise<WorkerResult> {
  return runPipeline(csvTexts, onProgress);
}
