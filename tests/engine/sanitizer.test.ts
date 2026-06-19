import { describe, it, expect } from "vitest";
import type { CoinbaseRawRow } from "@/engine/types";
import {
  sanitizeTransactions,
} from "@/engine/parser/sanitizer";

describe("sanitizer", () => {
  describe("Direction detection", () => {
    it('"0.5" → IN', () => {
      const raw: CoinbaseRawRow = {
        ID: "1",
        Timestamp: "2021-01-01 00:00:00 UTC",
        "Transaction Type": "Buy",
        Asset: "BTC",
        "Quantity Transacted": "0.5",
        "Price Currency": "EUR",
        "Price at Transaction": "€100",
        Subtotal: "€50",
        "Total (inclusive of fees and/or spread)": "€50",
        "Fees and/or Spread": "€0.00",
        Notes: "",
      };
      const s = sanitizeTransactions([raw]);
      expect(s[0].direction).toBe("IN");
    });

    it('"-0.5" → OUT', () => {
      const raw: CoinbaseRawRow = {
        ID: "1",
        Timestamp: "2021-01-01 00:00:00 UTC",
        "Transaction Type": "Sell",
        Asset: "BTC",
        "Quantity Transacted": "-0.5",
        "Price Currency": "EUR",
        "Price at Transaction": "€100",
        Subtotal: "€50",
        "Total (inclusive of fees and/or spread)": "€50",
        "Fees and/or Spread": "€0.00",
        Notes: "",
      };
      const s = sanitizeTransactions([raw]);
      expect(s[0].direction).toBe("OUT");
    });
  });

  describe("Timestamp parsing", () => {
    it('"2025-12-26 15:39:48 UTC" → Date válido', () => {
      const raw: CoinbaseRawRow = {
        ID: "1",
        Timestamp: "2025-12-26 15:39:48 UTC",
        "Transaction Type": "Buy",
        Asset: "BTC",
        "Quantity Transacted": "1",
        "Price Currency": "EUR",
        "Price at Transaction": "€100",
        Subtotal: "€100",
        "Total (inclusive of fees and/or spread)": "€100",
        "Fees and/or Spread": "€0.00",
        Notes: "",
      };
      const s = sanitizeTransactions([raw]);
      const date = s[0].timestamp;
      expect(date.getUTCFullYear()).toBe(2025);
      expect(date.getUTCMonth()).toBe(11); // Diciembre = 11
      expect(date.getUTCDate()).toBe(26);
      expect(date.getUTCHours()).toBe(15);
      expect(date.getUTCMinutes()).toBe(39);
      expect(date.getUTCSeconds()).toBe(48);
    });
  });

  describe("Convert notes regex", () => {
    it('extrae targetAsset y targetQuantity de "Converted 238.663484 ADA to 808.17982978 MATIC"', () => {
      const raw: CoinbaseRawRow = {
        ID: "1",
        Timestamp: "2021-01-01 00:00:00 UTC",
        "Transaction Type": "Convert",
        Asset: "ADA",
        "Quantity Transacted": "-238.663484",
        "Price Currency": "EUR",
        "Price at Transaction": "€0.60",
        Subtotal: "€143.20",
        "Total (inclusive of fees and/or spread)": "€143.20",
        "Fees and/or Spread": "€0.00",
        Notes: "Converted 238.663484 ADA to 808.17982978 MATIC",
      };
      const s = sanitizeTransactions([raw]);
      expect(s[0].convertTargetAsset).toBe("MATIC");
      expect(s[0].convertTargetQuantity!.toString()).toBe("808.17982978");
    });

    it("devuelve null para notas sin formato de convert", () => {
      const raw: CoinbaseRawRow = {
        ID: "1",
        Timestamp: "2021-01-01 00:00:00 UTC",
        "Transaction Type": "Buy",
        Asset: "BTC",
        "Quantity Transacted": "1",
        "Price Currency": "EUR",
        "Price at Transaction": "€100",
        Subtotal: "€100",
        "Total (inclusive of fees and/or spread)": "€100",
        "Fees and/or Spread": "€0.00",
        Notes: "Bought 0.5 BTC for 50 EUR",
      };
      const s = sanitizeTransactions([raw]);
      expect(s[0].convertTargetAsset).toBeNull();
      expect(s[0].convertTargetQuantity).toBeNull();
    });
  });

  describe("Receive classification", () => {
    it('senderAddress "Coinbase Earn" se clasifica correctamente', () => {
      const raw: CoinbaseRawRow = {
        ID: "1",
        Timestamp: "2021-01-01 00:00:00 UTC",
        "Transaction Type": "Receive",
        Asset: "AMP",
        "Quantity Transacted": "10",
        "Price Currency": "EUR",
        "Price at Transaction": "€1.00",
        Subtotal: "€10.00",
        "Total (inclusive of fees and/or spread)": "€10.00",
        "Fees and/or Spread": "€0.00",
        Notes: "Received 10 AMP from Coinbase Earn",
        "Sender Address": "Coinbase Earn",
      };

      const sanitized = sanitizeTransactions([raw]);
      expect(sanitized[0].senderAddress).toBe("Coinbase Earn");
    });

    it('senderAddress "an external account" se clasifica correctamente', () => {
      const raw: CoinbaseRawRow = {
        ID: "2",
        Timestamp: "2021-01-01 00:00:00 UTC",
        "Transaction Type": "Receive",
        Asset: "ETH",
        "Quantity Transacted": "1",
        "Price Currency": "EUR",
        "Price at Transaction": "€100",
        Subtotal: "€100",
        "Total (inclusive of fees and/or spread)": "€100",
        "Fees and/or Spread": "€0.00",
        Notes: "Received 1 ETH from an external account",
        "Sender Address": "an external account",
      };

      const sanitized = sanitizeTransactions([raw]);
      expect(sanitized[0].senderAddress).toBe("an external account");
    });
  });

  describe("Fee handling", () => {
    it("fee negativa en CSV → fee positiva en Decimal", () => {
      const raw: CoinbaseRawRow = {
        ID: "1",
        Timestamp: "2021-01-01 00:00:00 UTC",
        "Transaction Type": "Convert",
        Asset: "ADA",
        "Quantity Transacted": "-60",
        "Price Currency": "EUR",
        "Price at Transaction": "€1.00",
        Subtotal: "€60",
        "Total (inclusive of fees and/or spread)": "€59",
        "Fees and/or Spread": "-€1.00",
        Notes: "Converted 60 ADA to 10 MATIC",
      };

      const sanitized = sanitizeTransactions([raw]);
      // La fee debe ser positiva o al menos consistente con el valor absoluto
      expect(sanitized[0].fees.toString()).toBe("1");
    });
  });
});
