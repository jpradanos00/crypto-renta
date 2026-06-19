import { describe, it, expect } from "vitest";
import { parseMoney } from "@/lib/decimal";
import { parseCoinbaseCSV } from "@/engine/parser/coinbase";
import fs from "fs";
import path from "path";

describe("parseCoinbaseCSV", () => {
  describe("Metadatos", () => {
    it("salta correctamente las primeras 3 líneas de metadatos", () => {
      const csvText = fs.readFileSync(
        path.resolve(__dirname, "../../fixtures/sample-coinbase.csv"),
        "utf-8"
      );
      const rows = parseCoinbaseCSV(csvText);
      // La primera fila de datos debe tener un ID real, no "User"
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].ID).not.toBe("");
      expect(rows[0].ID).not.toMatch(/User|Transactions/);
      expect(rows[0].Timestamp).toBeDefined();
      expect(rows[0]["Transaction Type"]).toBeDefined();
    });
  });

  describe("Euro stripping", () => {
    it('convierte "€47.48750" a Decimal("47.48750")', () => {
      const parsed = parseMoney("€47.48750");
      // decimal.js-light normaliza trailing zeros en toString,
      // pero la precisión matemática se preserva
      expect(parsed.equals(parseMoney("47.48750"))).toBe(true);
      expect(parsed.toString()).toBe("47.4875");
    });

    it('convierte "-€265.91487" a Decimal("-265.91487")', () => {
      // Nota: el signo negativo delante del € debe preservarse
      const parsed = parseMoney("-€265.91487");
      expect(parsed.toString()).toBe("-265.91487");
    });

    it("maneja separadores de miles", () => {
      const parsed = parseMoney("€1,234.56");
      expect(parsed.toString()).toBe("1234.56");
    });
  });

  describe("Header aliases", () => {
    it('acepta "Spot Price Currency" como alias de "Price Currency"', () => {
      const csv = `
Transactions
User,Test User,test-id
ID,Timestamp,Transaction Type,Asset,Quantity Transacted,Spot Price Currency,Price at Transaction,Subtotal,Total (inclusive of fees and/or spread),Fees and/or Spread,Notes
1,2025-01-01 00:00:00 UTC,Buy,BTC,1,EUR,€100,€100,€100,€0.00,,`;
      const rows = parseCoinbaseCSV(csv);
      expect(rows.length).toBe(1);
      expect(rows[0]["Price Currency"]).toBe("EUR");
    });

    it('acepta "Price Currency" directamente', () => {
      const csv = `
Transactions
User,Test User,test-id
ID,Timestamp,Transaction Type,Asset,Quantity Transacted,Price Currency,Price at Transaction,Subtotal,Total (inclusive of fees and/or spread),Fees and/or Spread,Notes
1,2025-01-01 00:00:00 UTC,Buy,BTC,1,EUR,€100,€100,€100,€0.00,,`;
      const rows = parseCoinbaseCSV(csv);
      expect(rows.length).toBe(1);
      expect(rows[0]["Price Currency"]).toBe("EUR");
    });
  });

  describe("Empty CSV", () => {
    it("CSV con solo headers devuelve array vacío", () => {
      const csv = `ID,Timestamp,Transaction Type,Asset,Quantity Transacted,Price Currency,Price at Transaction,Subtotal,Total (inclusive of fees and/or spread),Fees and/or Spread,Notes`;
      const rows = parseCoinbaseCSV(csv);
      expect(rows).toEqual([]);
    });
  });

  describe("Parse CSV real", () => {
    it("parsea todas las filas de datos del CSV real", () => {
      const csvText = fs.readFileSync(
        path.resolve(__dirname, "../../fixtures/sample-coinbase.csv"),
        "utf-8"
      );
      const rows = parseCoinbaseCSV(csvText);

      // El CSV real tiene 1367 líneas total, pero 4 son metadatos + header
      // => ~1363 filas de datos
      expect(rows.length).toBeGreaterThan(1300);

      // Verificar que cada fila tiene los campos obligatorios
      for (const row of rows) {
        expect(row.ID).toBeTruthy();
        expect(row.Timestamp).toBeTruthy();
        expect(row["Transaction Type"]).toBeTruthy();
        expect(row.Asset).toBeTruthy();
      }
    });
  });
});
