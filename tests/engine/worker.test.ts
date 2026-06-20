import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { prepareCSVs, processCSVsInMainThread } from "@/engine/worker/bridge-fallback";

const csvPath = resolve(__dirname, "../../fixtures/sample-coinbase.csv");
const csvText = readFileSync(csvPath, "utf-8");

describe("worker pipeline (fallback)", () => {
  it("prepareCSVs parsea, sanitiza y deduplica", () => {
    const transactions = prepareCSVs([csvText]);
    expect(transactions.length).toBeGreaterThan(0);
    expect(transactions[0].id).toBeTruthy();
    expect(transactions[0].timestamp).toBeInstanceOf(Date);
  });

  it("runPipeline produce report completo con sendDecisions vacío", async () => {
    const transactions = prepareCSVs([csvText]);
    const progressCalls: { phase: string; percent: number }[] = [];

    const result = await processCSVsInMainThread(
      transactions,
      new Map(),
      (p) => {
        progressCalls.push({ phase: p.phase, percent: p.percent });
      }
    );

    expect(result.success).toBe(true);
    expect(result.reports).toBeInstanceOf(Map);
    expect(result.portfolioSnapshot).toBeInstanceOf(Map);
    expect(progressCalls.length).toBeGreaterThan(0);
    expect(progressCalls.some((p) => p.phase === "computing_fifo")).toBe(true);
    expect(progressCalls.some((p) => p.phase === "classifying")).toBe(true);
  });
});
