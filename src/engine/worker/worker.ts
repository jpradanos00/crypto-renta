import * as Comlink from "comlink";
import { runPipeline } from "@/engine/worker/pipeline";
import type { CryptoRentaWorker } from "@/engine/worker/types";

const workerAPI: CryptoRentaWorker = {
  async processCSVs(csvTexts, onProgress) {
    return runPipeline(csvTexts, onProgress);
  },
};

Comlink.expose(workerAPI);
