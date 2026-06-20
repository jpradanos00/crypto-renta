import type { DisposalEvent, AssetBreakdown } from "@/engine/types";
import { Decimal, ZERO } from "@/lib/decimal";

/**
 * Group disposal events by asset, summing transmission (proceeds),
 * acquisition (cost basis) and profit/loss per asset.
 * Results are sorted by absolute profit/loss descending (highest impact first).
 */
export function groupDisposalsByAsset(disposals: DisposalEvent[]): AssetBreakdown[] {
  const map = new Map<
    string,
    {
      transmissionValueEUR: Decimal;
      acquisitionValueEUR: Decimal;
      profitOrLossEUR: Decimal;
      transactionsCount: number;
      hasSell: boolean;
      hasConvert: boolean;
    }
  >();

  for (const d of disposals) {
    const existing = map.get(d.asset) ?? {
      transmissionValueEUR: ZERO,
      acquisitionValueEUR: ZERO,
      profitOrLossEUR: ZERO,
      transactionsCount: 0,
      hasSell: false,
      hasConvert: false,
    };

    map.set(d.asset, {
      transmissionValueEUR: existing.transmissionValueEUR.plus(d.proceedsEUR),
      acquisitionValueEUR: existing.acquisitionValueEUR.plus(d.costBasisEUR),
      profitOrLossEUR: existing.profitOrLossEUR.plus(d.gainLossEUR),
      transactionsCount: existing.transactionsCount + 1,
      hasSell: existing.hasSell || d.type === "Sell",
      hasConvert: existing.hasConvert || d.type === "Convert",
    });
  }

  const result: AssetBreakdown[] = Array.from(map.entries()).map(
    ([asset, vals]) => ({
      asset,
      transmissionValueEUR: vals.transmissionValueEUR,
      acquisitionValueEUR: vals.acquisitionValueEUR,
      profitOrLossEUR: vals.profitOrLossEUR,
      transactionsCount: vals.transactionsCount,
      hasSell: vals.hasSell,
      hasConvert: vals.hasConvert,
    })
  );

  // Sort by absolute impact (highest first)
  result.sort((a, b) =>
    b.profitOrLossEUR.abs().comparedTo(a.profitOrLossEUR.abs())
  );

  return result;
}
