import * as Comlink from "comlink";
import { prepareTransactions, runPipeline } from "@/engine/worker/pipeline";
import type { CryptoRentaWorker } from "@/engine/worker/types";

const workerAPI: CryptoRentaWorker = {
  async processCSVs(csvTexts, sendDecisions, onProgress) {
    const transactions = prepareTransactions(csvTexts);
    return runPipeline(transactions, sendDecisions, onProgress);
  },
};

Comlink.expose(workerAPI);
