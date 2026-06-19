import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { processCSVsInMainThread } from "@/engine/worker/bridge-fallback";

const csvPath = resolve(__dirname, "../../fixtures/sample-coinbase.csv");
const csvText = readFileSync(csvPath, "utf-8");

describe("worker pipeline (fallback)", () => {
  it("processes CSVs end-to-end via fallback", async () => {
    const progressCalls: { phase: string; percent: number }[] = [];
    const result = await processCSVsInMainThread([csvText], (p) => {
      progressCalls.push({ phase: p.phase, percent: p.percent });
    });

    expect(result.success).toBe(true);
    expect(result.reports).toBeInstanceOf(Map);
    expect(result.portfolioSnapshot).toBeInstanceOf(Map);
    expect(progressCalls.length).toBeGreaterThan(0);
    expect(progressCalls.some((p) => p.phase === "parsing")).toBe(true);
    expect(progressCalls.some((p) => p.phase === "sanitizing")).toBe(true);
    expect(progressCalls.some((p) => p.phase === "building_lots")).toBe(true);
    expect(progressCalls.some((p) => p.phase === "computing_fifo")).toBe(true);
    expect(progressCalls.some((p) => p.phase === "classifying")).toBe(true);
  });
});
