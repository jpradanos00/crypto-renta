import { describe, it, expect } from "vitest";
import { d } from "@/lib/decimal";
import { groupDisposalsByAsset } from "@/lib/fiscal-helpers";
import type { DisposalEvent } from "@/engine/types";

function makeDisposal(
  asset: string,
  proceedsEUR: string,
  costBasisEUR: string,
  overrides?: Partial<DisposalEvent>
): DisposalEvent {
  const gainLoss = d(proceedsEUR).minus(d(costBasisEUR));
  return {
    transactionId: `disp-${asset}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date("2025-06-15T00:00:00Z"),
    asset,
    quantityDisposed: d("1"),
    proceedsEUR: d(proceedsEUR),
    costBasisEUR: d(costBasisEUR),
    gainLossEUR: gainLoss,
    lotsConsumed: [],
    type: "Sell",
    ...overrides,
  };
}

describe("groupDisposalsByAsset", () => {
  it("agrupa múltiples disposals del mismo activo sumando correctamente", () => {
    const disposals: DisposalEvent[] = [
      makeDisposal("BTC", "500", "400"),  // +100
      makeDisposal("BTC", "300", "250"),  // +50
    ];

    const result = groupDisposalsByAsset(disposals);

    expect(result).toHaveLength(1);
    expect(result[0].asset).toBe("BTC");
    expect(result[0].transmissionValueEUR.toString()).toBe("800");
    expect(result[0].acquisitionValueEUR.toString()).toBe("650");
    expect(result[0].profitOrLossEUR.toString()).toBe("150");
    expect(result[0].transactionsCount).toBe(2);
  });

  it("agrupa disposals de activos distintos por separado", () => {
    const disposals: DisposalEvent[] = [
      makeDisposal("BTC", "500", "400"),   // +100
      makeDisposal("ETH", "200", "250"),   // -50
      makeDisposal("BTC", "300", "200"),   // +100
    ];

    const result = groupDisposalsByAsset(disposals);

    expect(result).toHaveLength(2);
    const btc = result.find((r) => r.asset === "BTC")!;
    const eth = result.find((r) => r.asset === "ETH")!;

    expect(btc.transmissionValueEUR.toString()).toBe("800");
    expect(btc.acquisitionValueEUR.toString()).toBe("600");
    expect(btc.profitOrLossEUR.toString()).toBe("200");
    expect(btc.transactionsCount).toBe(2);

    expect(eth.transmissionValueEUR.toString()).toBe("200");
    expect(eth.acquisitionValueEUR.toString()).toBe("250");
    expect(eth.profitOrLossEUR.toString()).toBe("-50");
    expect(eth.transactionsCount).toBe(1);
  });

  it("ordena por impacto fiscal absoluto descendente", () => {
    const disposals: DisposalEvent[] = [
      makeDisposal("ADA", "100", "90"),    // +10
      makeDisposal("BTC", "500", "300"),   // +200
      makeDisposal("ETH", "200", "250"),   // -50
    ];

    const result = groupDisposalsByAsset(disposals);

    expect(result.map((r) => r.asset)).toEqual(["BTC", "ETH", "ADA"]);
  });

  it("devuelve array vacío si no hay disposals", () => {
    const result = groupDisposalsByAsset([]);
    expect(result).toEqual([]);
  });

  it("la suma del desglose cuadra con el total global", () => {
    const disposals: DisposalEvent[] = [
      makeDisposal("BTC", "500", "400"),   // +100
      makeDisposal("ETH", "200", "250"),   // -50
      makeDisposal("BTC", "300", "200"),   // +100
      makeDisposal("ADA", "100", "90"),    // +10
    ];

    const result = groupDisposalsByAsset(disposals);

    const sumTransmission = result.reduce(
      (acc, r) => acc.plus(r.transmissionValueEUR),
      d("0")
    );
    const sumAcquisition = result.reduce(
      (acc, r) => acc.plus(r.acquisitionValueEUR),
      d("0")
    );
    const sumProfitLoss = result.reduce(
      (acc, r) => acc.plus(r.profitOrLossEUR),
      d("0")
    );

    // Global totals
    const globalTransmission = disposals.reduce(
      (acc, d) => acc.plus(d.proceedsEUR),
      d("0")
    );
    const globalAcquisition = disposals.reduce(
      (acc, d) => acc.plus(d.costBasisEUR),
      d("0")
    );
    const globalProfitLoss = disposals.reduce(
      (acc, d) => acc.plus(d.gainLossEUR),
      d("0")
    );

    expect(sumTransmission.eq(globalTransmission)).toBe(true);
    expect(sumAcquisition.eq(globalAcquisition)).toBe(true);
    expect(sumProfitLoss.eq(globalProfitLoss)).toBe(true);
  });

  it("maneja ganancia cero correctamente", () => {
    const disposals: DisposalEvent[] = [
      makeDisposal("BTC", "100", "100"), // 0
    ];

    const result = groupDisposalsByAsset(disposals);

    expect(result[0].profitOrLossEUR.toString()).toBe("0");
    expect(result[0].profitOrLossEUR.isZero()).toBe(true);
  });
});
