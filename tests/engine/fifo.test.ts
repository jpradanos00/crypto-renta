import { describe, it, expect } from "vitest";
import { FIFOEngine } from "@/engine/fifo/engine";
import type { SanitizedTransaction } from "@/engine/types";
import { d, ZERO } from "@/lib/decimal";

function makeTx(
  overrides: Partial<SanitizedTransaction> = {}
): SanitizedTransaction {
  return {
    id: "tx-1",
    timestamp: new Date("2024-06-15T10:00:00Z"),
    type: "Buy",
    asset: "BTC",
    quantity: d("1"),
    direction: "IN",
    priceCurrency: "EUR",
    priceAtTransaction: d("100"),
    subtotal: d("100"),
    totalInclFees: d("100"),
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

describe("FIFOEngine", () => {
  describe("Buy", () => {
    it("creates a cost basis lot including fees", () => {
      const engine = new FIFOEngine();
      // Compra: subtotal 200 + fees 10 = total 210. Cost basis real = 210
      engine.processTransaction(makeTx({ type: "Buy", quantity: d("2"), subtotal: d("200"), totalInclFees: d("210"), fees: d("10") }));
      const snapshot = engine.getPortfolioSnapshot();
      expect(snapshot.has("BTC")).toBe(true);
      const lots = snapshot.get("BTC")!;
      expect(lots).toHaveLength(1);
      expect(lots[0].remainingQuantity.toString()).toBe("2");
      expect(lots[0].costPerUnit.toString()).toBe("105"); // 210 / 2
    });

    it("ignores zero quantity buys", () => {
      const engine = new FIFOEngine();
      engine.processTransaction(makeTx({ type: "Buy", quantity: ZERO }));
      expect(engine.getPortfolioSnapshot().has("BTC")).toBe(false);
    });
  });

  describe("Sell", () => {
    it("consumes lots FIFO and records a disposal with gain net of fees", () => {
      const engine = new FIFOEngine();
      // Compra con fees: total = 105, cost basis real = 105
      engine.processTransaction(makeTx({ id: "b1", type: "Buy", quantity: d("1"), subtotal: d("100"), totalInclFees: d("105"), fees: d("5") }));
      // Venta con fees: recibes 150 - 5 fees = 145 neto
      engine.processTransaction(makeTx({ id: "s1", type: "Sell", quantity: d("1"), subtotal: d("150"), totalInclFees: d("145"), fees: d("5"), direction: "OUT" }));

      const disposals = engine.getDisposals();
      expect(disposals).toHaveLength(1);
      // Ganancia = proceeds netos (145) - cost basis real (105) = 40
      expect(disposals[0].gainLossEUR.toString()).toBe("40");
      expect(disposals[0].costBasisEUR.toString()).toBe("105");
      expect(disposals[0].proceedsEUR.toString()).toBe("145");

      const snapshot = engine.getPortfolioSnapshot();
      expect(snapshot.get("BTC")?.length ?? 0).toBe(0);
    });

    it("consumes partial lot and leaves remainder", () => {
      const engine = new FIFOEngine();
      engine.processTransaction(makeTx({ id: "b1", type: "Buy", quantity: d("2"), subtotal: d("200") }));
      engine.processTransaction(makeTx({ id: "s1", type: "Sell", quantity: d("1"), subtotal: d("150"), direction: "OUT" }));

      const snapshot = engine.getPortfolioSnapshot();
      const lots = snapshot.get("BTC")!;
      expect(lots).toHaveLength(1);
      expect(lots[0].remainingQuantity.toString()).toBe("1");
    });

    it("consumes multiple lots in FIFO order", () => {
      const engine = new FIFOEngine();
      engine.processTransaction(makeTx({ id: "b1", type: "Buy", quantity: d("1"), subtotal: d("100"), totalInclFees: d("100"), timestamp: new Date("2024-01-01") }));
      engine.processTransaction(makeTx({ id: "b2", type: "Buy", quantity: d("1"), subtotal: d("200"), totalInclFees: d("200"), timestamp: new Date("2024-02-01") }));
      engine.processTransaction(makeTx({ id: "s1", type: "Sell", quantity: d("1.5"), subtotal: d("300"), totalInclFees: d("300"), direction: "OUT" }));

      const disposals = engine.getDisposals();
      expect(disposals[0].costBasisEUR.toString()).toBe("200"); // 1*100 + 0.5*200
      expect(disposals[0].gainLossEUR.toString()).toBe("100");

      const lots = engine.getPortfolioSnapshot().get("BTC")!;
      expect(lots).toHaveLength(1);
      expect(lots[0].remainingQuantity.toString()).toBe("0.5");
      expect(lots[0].costPerUnit.toString()).toBe("200");
    });

    it("emits INSUFFICIENT_LOTS warning when selling more than owned", () => {
      const engine = new FIFOEngine();
      engine.processTransaction(makeTx({ id: "b1", type: "Buy", quantity: d("1"), subtotal: d("100"), totalInclFees: d("100") }));
      engine.processTransaction(makeTx({ id: "s1", type: "Sell", quantity: d("2"), subtotal: d("300"), totalInclFees: d("300"), direction: "OUT" }));

      const warnings = engine.getWarnings();
      expect(warnings.some((w) => w.code === "INSUFFICIENT_LOTS")).toBe(true);

      const disposals = engine.getDisposals();
      expect(disposals[0].gainLossEUR.toString()).toBe("200"); // 300 - 100 (cost basis of missing is 0)
    });
  });

  describe("Send", () => {
    it("removes lots without recording a disposal and emits warning", () => {
      const engine = new FIFOEngine();
      engine.processTransaction(makeTx({ id: "b1", type: "Buy", quantity: d("1"), subtotal: d("100") }));
      engine.processTransaction(makeTx({ id: "send1", type: "Send", quantity: d("1"), subtotal: d("0"), direction: "OUT" }));

      expect(engine.getDisposals()).toHaveLength(0);
      expect(engine.getPortfolioSnapshot().get("BTC")?.length ?? 0).toBe(0);

      const warnings = engine.getWarnings();
      expect(warnings.some((w) => w.code === "SEND_AS_TRANSFER")).toBe(true);
    });

    it("genera DisposalEvent cuando se marca como tercero (third-party)", () => {
      const decisions = new Map<string, "own" | "third-party">();
      decisions.set("send1", "third-party");

      const engine = new FIFOEngine(decisions);
      engine.processTransaction(makeTx({ id: "b1", type: "Buy", quantity: d("1"), subtotal: d("100"), totalInclFees: d("100") }));
      engine.processTransaction(makeTx({ id: "send1", type: "Send", quantity: d("1"), subtotal: d("150"), totalInclFees: d("150"), direction: "OUT" }));

      const disposals = engine.getDisposals();
      expect(disposals).toHaveLength(1);
      expect(disposals[0].type).toBe("Sell");
      expect(disposals[0].gainLossEUR.toString()).toBe("50"); // 150 - 100 = 50
      expect(disposals[0].proceedsEUR.toString()).toBe("150");

      const warnings = engine.getWarnings();
      expect(warnings.some((w) => w.code === "SEND_TO_THIRD_PARTY")).toBe(true);
    });
  });

  describe("Receive", () => {
    it("creates a lot for external receive without income", () => {
      const engine = new FIFOEngine();
      engine.processTransaction(
        makeTx({ type: "Receive", senderAddress: "external", quantity: d("1"), subtotal: d("100") })
      );

      const snapshot = engine.getPortfolioSnapshot();
      expect(snapshot.get("BTC")?.length).toBe(1);
      expect(engine.getIncomes()).toHaveLength(0);
    });

    it("creates a lot and cubo 3 income for Coinbase Earn", () => {
      const engine = new FIFOEngine();
      engine.processTransaction(
        makeTx({ type: "Receive", senderAddress: "Coinbase Earn", quantity: d("1"), subtotal: d("100") })
      );

      const incomes = engine.getIncomes();
      expect(incomes).toHaveLength(1);
      expect(incomes[0].cubo).toBe(3);
      expect(incomes[0].category).toBe("coinbase_earn");
      expect(incomes[0].fairMarketValueEUR.toString()).toBe("100");
    });

    it("creates a lot and cubo 2 income for Aggregate Rewards", () => {
      const engine = new FIFOEngine();
      engine.processTransaction(
        makeTx({ type: "Receive", senderAddress: "Aggregate Rewards", quantity: d("1"), subtotal: d("100") })
      );

      const incomes = engine.getIncomes();
      expect(incomes).toHaveLength(1);
      expect(incomes[0].cubo).toBe(2);
      expect(incomes[0].category).toBe("aggregate_reward");
    });
  });

  describe("Staking / Income types", () => {
    it("creates a lot and income event for Staking Income", () => {
      const engine = new FIFOEngine();
      engine.processTransaction(
        makeTx({ type: "Staking Income", quantity: d("0.5"), priceAtTransaction: d("200"), subtotal: d("0") })
      );

      const snapshot = engine.getPortfolioSnapshot();
      const lots = snapshot.get("BTC")!;
      expect(lots[0].costPerUnit.toString()).toBe("200");

      const incomes = engine.getIncomes();
      expect(incomes).toHaveLength(1);
      expect(incomes[0].cubo).toBe(2);
      expect(incomes[0].fairMarketValueEUR.toString()).toBe("100"); // 0.5 * 200
    });

    it("creates a lot and income event for Inflation Reward", () => {
      const engine = new FIFOEngine();
      engine.processTransaction(
        makeTx({ type: "Inflation Reward", quantity: d("1"), priceAtTransaction: d("50") })
      );
      const incomes = engine.getIncomes();
      expect(incomes[0].category).toBe("inflation_reward");
      expect(incomes[0].fairMarketValueEUR.toString()).toBe("50");
    });

    it("creates a lot and income event for Retail Simple Price Improvement", () => {
      const engine = new FIFOEngine();
      engine.processTransaction(
        makeTx({ type: "Retail Simple Price Improvement", quantity: d("1"), priceAtTransaction: d("10") })
      );
      const incomes = engine.getIncomes();
      expect(incomes[0].category).toBe("price_improvement");
      expect(incomes[0].cubo).toBe(2);
    });
  });

  describe("Convert", () => {
    it("parses notes, records disposal and creates target lot", () => {
      const engine = new FIFOEngine();
      engine.processTransaction(makeTx({ id: "b1", type: "Buy", quantity: d("2"), subtotal: d("200"), totalInclFees: d("200") }));
      engine.processTransaction(
        makeTx({
          id: "c1",
          type: "Convert",
          asset: "BTC",
          quantity: d("1"),
          subtotal: d("150"),
          totalInclFees: d("150"),
          direction: "OUT",
          notes: "Converted 1 BTC to 10 ETH",
        })
      );

      const disposals = engine.getDisposals();
      expect(disposals).toHaveLength(1);
      expect(disposals[0].gainLossEUR.toString()).toBe("50"); // 150 - 100

      const snapshot = engine.getPortfolioSnapshot();
      const btcLots = snapshot.get("BTC")!;
      expect(btcLots).toHaveLength(1);
      expect(btcLots[0].remainingQuantity.toString()).toBe("1");

      const ethLots = snapshot.get("ETH")!;
      expect(ethLots).toHaveLength(1);
      expect(ethLots[0].remainingQuantity.toString()).toBe("10");
      expect(ethLots[0].costPerUnit.toString()).toBe("15"); // 150 / 10
    });

    it("uses convertTargetAsset/Quantity when available", () => {
      const engine = new FIFOEngine();
      engine.processTransaction(makeTx({ id: "b1", type: "Buy", quantity: d("1"), subtotal: d("100"), totalInclFees: d("100") }));
      engine.processTransaction(
        makeTx({
          id: "c1",
          type: "Convert",
          asset: "BTC",
          quantity: d("1"),
          subtotal: d("120"),
          totalInclFees: d("120"),
          direction: "OUT",
          notes: "",
          convertTargetAsset: "LTC",
          convertTargetQuantity: d("4"),
        })
      );

      const snapshot = engine.getPortfolioSnapshot();
      const ltcLots = snapshot.get("LTC")!;
      expect(ltcLots[0].costPerUnit.toString()).toBe("30"); // 120 / 4
    });

    it("usa subtotal (bruto) no totalInclFees (neto) para el cost basis del target", () => {
      const engine = new FIFOEngine();
      engine.processTransaction(makeTx({ id: "b1", type: "Buy", quantity: d("1"), subtotal: d("100"), totalInclFees: d("100") }));
      engine.processTransaction(
        makeTx({
          id: "c1",
          type: "Convert",
          asset: "BTC",
          quantity: d("1"),
          subtotal: d("150"),       // valor bruto de mercado
          totalInclFees: d("145"),  // neto tras fees (150 - 5)
          direction: "OUT",
          notes: "Converted 1 BTC to 10 ETH",
        })
      );

      const snapshot = engine.getPortfolioSnapshot();
      const ethLots = snapshot.get("ETH")!;
      // Art. 35.2 LIRPF: coste de adquisición = valor bruto, no neto
      expect(ethLots[0].costPerUnit.toString()).toBe("15"); // 150 / 10, no 145/10 = 14.5
    });

    it("falls back to totalInclFees and emits warning when parse fails", () => {
      const engine = new FIFOEngine();
      engine.processTransaction(makeTx({ id: "b1", type: "Buy", quantity: d("1"), subtotal: d("100"), totalInclFees: d("100") }));
      engine.processTransaction(
        makeTx({
          id: "c1",
          type: "Convert",
          asset: "BTC",
          quantity: d("1"),
          subtotal: d("150"),
          totalInclFees: d("150"),
          direction: "OUT",
          notes: "some random note",
        })
      );

      const warnings = engine.getWarnings();
      expect(warnings.some((w) => w.code === "CONVERT_PARSE_FAILED")).toBe(true);

      const disposals = engine.getDisposals();
      expect(disposals).toHaveLength(1);
      expect(disposals[0].gainLossEUR.toString()).toBe("50");

      // No target lot should be created
      expect(engine.getPortfolioSnapshot().has("ETH")).toBe(false);
    });
  });

  describe("Asset Migration", () => {
    it("transfers lots preserving cost basis when paired", () => {
      const engine = new FIFOEngine();
      const ts = new Date("2024-03-01T12:00:00Z");
      // Compra con fees: total 210 para 2 BTC => costPerUnit = 105
      engine.processTransaction(
        makeTx({ id: "b1", type: "Buy", asset: "BTC", quantity: d("2"), subtotal: d("200"), totalInclFees: d("210"), fees: d("10"), timestamp: new Date("2024-01-01") })
      );
      engine.processTransaction(
        makeTx({ id: "m-out", type: "Asset Migration", asset: "BTC", quantity: d("1"), direction: "OUT", timestamp: ts })
      );
      engine.processTransaction(
        makeTx({ id: "m-in", type: "Asset Migration", asset: "BCH", quantity: d("1"), direction: "IN", timestamp: ts })
      );

      const snapshot = engine.getPortfolioSnapshot();
      const btcLots = snapshot.get("BTC")!;
      expect(btcLots[0].remainingQuantity.toString()).toBe("1");

      const bchLots = snapshot.get("BCH")!;
      expect(bchLots).toHaveLength(1);
      expect(bchLots[0].remainingQuantity.toString()).toBe("1");
      expect(bchLots[0].costPerUnit.toString()).toBe("105"); // hereda el cost basis real con fees
      expect(bchLots[0].acquiredAt.getTime()).toBe(new Date("2024-01-01").getTime());
    });

    it("creates lot normally when IN has no matching OUT", () => {
      const engine = new FIFOEngine();
      engine.processTransaction(
        makeTx({ id: "m-in", type: "Asset Migration", asset: "BTC", quantity: d("1"), subtotal: d("50"), direction: "IN" })
      );

      const snapshot = engine.getPortfolioSnapshot();
      const lots = snapshot.get("BTC")!;
      expect(lots[0].costPerUnit.toString()).toBe("50");
    });

    it("does nothing for unmatched OUT", () => {
      const engine = new FIFOEngine();
      engine.processTransaction(
        makeTx({ id: "m-out", type: "Asset Migration", asset: "BTC", quantity: d("1"), direction: "OUT" })
      );

      expect(engine.getPortfolioSnapshot().has("BTC")).toBe(false);
      expect(engine.getWarnings()).toHaveLength(0);
    });
  });

  describe("Ignored types", () => {
    it("ignores Deposit, Withdrawal, Retail Staking/Unstaking Transfers", () => {
      const engine = new FIFOEngine();
      engine.processTransaction(makeTx({ type: "Deposit", direction: "IN", quantity: d("1"), subtotal: d("100") }));
      engine.processTransaction(makeTx({ type: "Withdrawal", direction: "OUT", quantity: d("1"), subtotal: d("100") }));
      engine.processTransaction(makeTx({ type: "Retail Staking Transfer", direction: "OUT", quantity: d("1"), subtotal: d("100") }));
      engine.processTransaction(makeTx({ type: "Retail Unstaking Transfer", direction: "IN", quantity: d("1"), subtotal: d("100") }));

      expect(engine.getPortfolioSnapshot().size).toBe(0);
      expect(engine.getDisposals()).toHaveLength(0);
      expect(engine.getIncomes()).toHaveLength(0);
    });
  });
});
