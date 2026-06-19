import { describe, it, expect } from "vitest";
import { Decimal } from "@/lib/decimal";
import { processCSVsInMainThread } from "@/engine/worker/bridge-fallback";
import fs from "fs";
import path from "path";

describe("Integration: pipeline completo", () => {
  describe("Pipeline completo con CSV real", () => {
    it("lee el CSV real, procesa y produce al menos un FiscalYearReport", async () => {
      const csvText = fs.readFileSync(
        path.resolve(__dirname, "../../fixtures/sample-coinbase.csv"),
        "utf-8"
      );

      const result = await processCSVsInMainThread([csvText], () => {});

      expect(result.success).toBe(true);
      // TDD: El pipeline completo (FIFO + classifier + reporter) aún no está implementado.
      // Cuando A y B terminen su código, este test pasará.
      expect(result.reports.size).toBeGreaterThan(0);
      expect(result.availableYears.length).toBeGreaterThan(0);

      // Verificar que hay transacciones en los reports
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

      // Pasar el mismo CSV dos veces simula duplicados
      const result = await processCSVsInMainThread([csvText, csvText], () => {});

      expect(result.success).toBe(true);

      // Contar transacciones totales en todos los reports
      let totalTxs = 0;
      for (const year of result.availableYears) {
        totalTxs += result.reports.get(year)!.allTransactions.length;
      }

      // El total no debe duplicarse
      const csvText2 = fs.readFileSync(
        path.resolve(__dirname, "../../fixtures/sample-coinbase.csv"),
        "utf-8"
      );
      const singleResult = await processCSVsInMainThread([csvText2], () => {});
      let singleTotalTxs = 0;
      for (const year of singleResult.availableYears) {
        singleTotalTxs += singleResult.reports.get(year)!.allTransactions.length;
      }

      // TDD: El pipeline aún no integra deduplicación.
      // Este test asegura que cuando se implemente, no haya duplicados.
      expect(singleTotalTxs).toBeGreaterThan(0);
      expect(totalTxs).toBe(singleTotalTxs);
    });
  });

  describe("Precision torture", () => {
    it("preserva precisión con valores reales del CSV", async () => {
      const csvText = fs.readFileSync(
        path.resolve(__dirname, "../../fixtures/sample-coinbase.csv"),
        "utf-8"
      );

      const result = await processCSVsInMainThread([csvText], () => {});
      expect(result.success).toBe(true);

      // Buscar un report que tenga transacciones y verificar que los Decimals
      // preservan la precisión original
      for (const year of result.availableYears) {
        const report = result.reports.get(year)!;
        for (const tx of report.allTransactions) {
          // Asegurar que no hay valores truncados a number de JS
          // (Decimal se crea desde string, por lo que esto sirve como smoke test)
          expect(tx.quantity).toBeInstanceOf(Decimal);
          expect(tx.priceAtTransaction).toBeInstanceOf(Decimal);
        }
      }
    });
  });
});
