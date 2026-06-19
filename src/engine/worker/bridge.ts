import * as Comlink from "comlink";
import type { CryptoRentaWorker } from "@/engine/worker/types";

export function createWorker(): Comlink.Remote<CryptoRentaWorker> | null {
  if (typeof window === "undefined" || typeof Worker === "undefined") {
    return null;
  }
  try {
    const worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
    return Comlink.wrap<CryptoRentaWorker>(worker);
  } catch {
    return null;
  }
}
