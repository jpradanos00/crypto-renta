import { describe, it, expect } from "vitest";
import { Decimal } from "@/lib/decimal";
import { prepareCSVs, processCSVsInMainThread } from "@/engine/worker/bridge-fallback";
import fs from "fs";
import path from "path";

describe("Integration: pipeline completo", () => {
  describe("Pipeline completo con CSV real", () => {
    it("lee el CSV real, procesa y produce al menos un FiscalYearReport", async () => {
      const csvText = fs.readFileSync(
        path.resolve(__dirname, "../../fixtures/sample-coinbase.csv"),
        "utf-8"
      );

      const transactions = prepareCSVs([csvText]);
      const result = await processCSVsInMainThread(transactions, new Map(), () => {});

      expect(result.success).toBe(true);
      expect(result.reports.size).toBeGreaterThan(0);
      expect(result.availableYears.length).toBeGreaterThan(0);

      const firstYear = result.availableYears[0];
      const report = result.reports.get(firstYear)!;
      expect(report.allTransactions.length).toBeGreaterThan(0);
    });
  });

  describe("Múltiples CSVs", () => {
    it("deduplica transacciones por ID cuando hay CSVs superpuestos", async () => {
      const csvText = fs.readFileSync(
        path.resolve(__dirname, "../../fixtures/sample-coinbase.csv"),
        "utf-8"
      );

      const singleTransactions = prepareCSVs([csvText]);
      const duplicateTransactions = prepareCSVs([csvText, csvText]);

      expect(duplicateTransactions.length).toBe(singleTransactions.length);
    });
  });

  describe("Precision torture", () => {
    it("preserva precisión con valores reales del CSV", async () => {
      const csvText = fs.readFileSync(
        path.resolve(__dirname, "../../fixtures/sample-coinbase.csv"),
        "utf-8"
      );

      const transactions = prepareCSVs([csvText]);
      const result = await processCSVsInMainThread(transactions, new Map(), () => {});
      expect(result.success).toBe(true);

      for (const year of result.availableYears) {
        const report = result.reports.get(year)!;
        for (const tx of report.allTransactions) {
          expect(tx.quantity).toBeInstanceOf(Decimal);
          expect(tx.priceAtTransaction).toBeInstanceOf(Decimal);
        }
      }
    });
  });
});
