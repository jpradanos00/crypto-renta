import { describe, it, expect } from "vitest";
import { d } from "@/lib/decimal";
import type { SanitizedTransaction } from "@/engine/types";
import { classifyTransaction } from "@/engine/fiscal/classifier";

function makeTx(
  overrides: Partial<SanitizedTransaction> &
    Pick<SanitizedTransaction, "type" | "asset" | "quantity" | "priceAtTransaction">
): SanitizedTransaction {
  return {
    id: `tx-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date("2025-01-01T00:00:00Z"),
    direction: "IN",
    priceCurrency: "EUR",
    subtotal: d("0"),
    totalInclFees: d("0"),
    fees: d("0"),
    notes: "",
    senderAddress: null,
    recipientAddress: null,
    convertTargetAsset: null,
    convertTargetQuantity: null,
    source: "coinbase",
    ...overrides,
  };
}

describe("classifyTransaction", () => {
  describe("Cubo 2", () => {
    it("Staking Income → cubo 2", () => {
      const tx = makeTx({
        type: "Staking Income",
        asset: "ADA",
        quantity: d("0.3"),
        priceAtTransaction: d("0.50"),
      });
      const income = classifyTransaction(tx);
      expect(income).not.toBeNull();
      expect(income.cubo).toBe(2);
      expect(income.category).toBe("staking");
    });

    it("Inflation Reward → cubo 2", () => {
      const tx = makeTx({
        type: "Inflation Reward",
        asset: "XTZ",
        quantity: d("0.001"),
        priceAtTransaction: d("0.50"),
      });
      const income = classifyTransaction(tx);
      expect(income).not.toBeNull();
      expect(income.cubo).toBe(2);
      expect(income.category).toBe("inflation_reward");
    });

    it("Reward Income → cubo 2", () => {
      const tx = makeTx({
        type: "Reward Income",
        asset: "ADA",
        quantity: d("0.06"),
        priceAtTransaction: d("0.35"),
      });
      const income = classifyTransaction(tx);
      expect(income).not.toBeNull();
      expect(income.cubo).toBe(2);
      expect(income.category).toBe("reward_income");
    });

    it("Receive + Aggregate Rewards → cubo 2", () => {
      const tx = makeTx({
        type: "Receive",
        asset: "ADA",
        quantity: d("0.08"),
        priceAtTransaction: d("0.50"),
        senderAddress: "Aggregate Rewards",
        notes: "Received 0.08 ADA from Aggregate Rewards",
      });
      const income = classifyTransaction(tx);
      expect(income).not.toBeNull();
      expect(income.cubo).toBe(2);
      expect(income.category).toBe("aggregate_reward");
    });
  });

  describe("Cubo 3", () => {
    it("Receive + Coinbase Earn → cubo 3", () => {
      const tx = makeTx({
        type: "Receive",
        asset: "CLV",
        quantity: d("0.81"),
        priceAtTransaction: d("1.07"),
        senderAddress: "Coinbase Earn",
        notes: "Received 0.81 CLV from Coinbase Earn",
      });
      const income = classifyTransaction(tx);
      expect(income).not.toBeNull();
      expect(income.cubo).toBe(3);
      expect(income.category).toBe("coinbase_earn");
    });

    it("Receive + Flare Airdrop → cubo 3", () => {
      const tx = makeTx({
        type: "Receive",
        asset: "FLR",
        quantity: d("1.5"),
        priceAtTransaction: d("0.032"),
        senderAddress: "Flare Airdrop",
        notes: "Received 1.5 FLR from Flare Airdrop",
      });
      const income = classifyTransaction(tx);
      expect(income).not.toBeNull();
      expect(income.cubo).toBe(3);
      expect(income.category).toBe("airdrop");
    });
  });

  describe("No sujeto", () => {
    it("Receive + external → null", () => {
      const tx = makeTx({
        type: "Receive",
        asset: "ETH",
        quantity: d("1"),
        priceAtTransaction: d("100"),
        senderAddress: "an external account",
        notes: "Received 1 ETH from an external account",
      });
      const income = classifyTransaction(tx);
      expect(income.cubo).toBeNull();
      expect(income.category).toBeNull();
    });

    it("Buy → null", () => {
      const tx = makeTx({
        type: "Buy",
        asset: "BTC",
        quantity: d("1"),
        priceAtTransaction: d("100"),
      });
      expect(classifyTransaction(tx).cubo).toBeNull();
    });

    it("Sell → null", () => {
      const tx = makeTx({
        type: "Sell",
        asset: "BTC",
        quantity: d("1"),
        priceAtTransaction: d("100"),
      });
      expect(classifyTransaction(tx).cubo).toBeNull();
    });

    it("Convert → null", () => {
      const tx = makeTx({
        type: "Convert",
        asset: "ADA",
        quantity: d("60"),
        priceAtTransaction: d("0.60"),
      });
      expect(classifyTransaction(tx).cubo).toBeNull();
    });

    it("Send → null", () => {
      const tx = makeTx({
        type: "Send",
        asset: "ETH",
        quantity: d("2"),
        priceAtTransaction: d("100"),
      });
      expect(classifyTransaction(tx).cubo).toBeNull();
    });
  });
});
