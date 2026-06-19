import { Decimal, ZERO } from "@/lib/decimal";
import type {
  SanitizedTransaction,
  CostBasisLot,
  DisposalEvent,
  IncomeEvent,
  CalculationWarning,
  LotConsumption,
} from "@/engine/types";
import { classifyTransaction } from "@/engine/fiscal/classifier";

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

interface ConsumedLotDetail {
  lotId: string;
  quantityUsed: Decimal;
  costPerUnit: Decimal;
  acquiredAt: Date;
}

interface LotConsumptionResult {
  consumed: LotConsumption[];
  consumedDetails: ConsumedLotDetail[];
  costBasisTotal: Decimal;
  shortfall: Decimal;
}

export class FIFOEngine {
  private lots: Map<string, CostBasisLot[]> = new Map();
  private disposals: DisposalEvent[] = [];
  private incomes: IncomeEvent[] = [];
  private warnings: CalculationWarning[] = [];
  private pendingMigrationsOut: Map<
    string,
    { asset: string; quantity: Decimal }
  > = new Map();

  processTransaction(tx: SanitizedTransaction): void {
    switch (tx.type) {
      case "Buy":
        this.handleBuy(tx);
        break;
      case "Sell":
        this.handleSell(tx);
        break;
      case "Convert":
        this.handleConvert(tx);
        break;
      case "Send":
        this.handleSend(tx);
        break;
      case "Receive":
        this.handleReceive(tx);
        break;
      case "Staking Income":
      case "Inflation Reward":
      case "Reward Income":
      case "Retail Simple Price Improvement":
        this.handleIncome(tx);
        break;
      case "Asset Migration":
        this.handleAssetMigration(tx);
        break;
      case "Deposit":
      case "Withdrawal":
      case "Retail Staking Transfer":
      case "Retail Unstaking Transfer":
        // Ignorar fiscalmente
        break;
      default:
        this.warnings.push({
          transactionId: tx.id,
          code: "UNKNOWN_TRANSACTION_TYPE",
          message: `Tipo de transacción desconocido: ${tx.type}`,
        });
    }
  }

  getPortfolioSnapshot(): Map<string, CostBasisLot[]> {
    const snapshot = new Map<string, CostBasisLot[]>();
    for (const [asset, lotList] of this.lots) {
      snapshot.set(
        asset,
        lotList.map((lot) => ({ ...lot }))
      );
    }
    return snapshot;
  }

  getDisposals(): DisposalEvent[] {
    return [...this.disposals];
  }

  getIncomes(): IncomeEvent[] {
    return [...this.incomes];
  }

  getWarnings(): CalculationWarning[] {
    return [...this.warnings];
  }

  // ── Private Handlers ──

  private handleBuy(tx: SanitizedTransaction): void {
    if (tx.quantity.lte(0)) return;
    // Precio de adquisición incluye comisiones (gastos accesorios)
    const costBasisTotal = tx.totalInclFees;
    const costPerUnit = costBasisTotal.dividedBy(tx.quantity);
    this.addLot({
      id: generateId(),
      asset: tx.asset,
      remainingQuantity: tx.quantity,
      originalQuantity: tx.quantity,
      costPerUnit,
      acquiredAt: tx.timestamp,
      source: "Buy",
    });
  }

  private handleReceive(tx: SanitizedTransaction): void {
    if (tx.quantity.lte(0)) return;
    const costPerUnit = tx.subtotal.dividedBy(tx.quantity);
    this.addLot({
      id: generateId(),
      asset: tx.asset,
      remainingQuantity: tx.quantity,
      originalQuantity: tx.quantity,
      costPerUnit,
      acquiredAt: tx.timestamp,
      source: "Receive",
    });

    const classification = classifyTransaction(tx);
    if (classification.cubo && classification.category) {
      this.incomes.push({
        transactionId: tx.id,
        timestamp: tx.timestamp,
        asset: tx.asset,
        quantity: tx.quantity,
        fairMarketValueEUR: tx.subtotal,
        cubo: classification.cubo,
        category: classification.category,
      });
    }
  }

  private handleIncome(tx: SanitizedTransaction): void {
    if (tx.quantity.lte(0)) return;
    const costPerUnit = tx.priceAtTransaction;
    this.addLot({
      id: generateId(),
      asset: tx.asset,
      remainingQuantity: tx.quantity,
      originalQuantity: tx.quantity,
      costPerUnit,
      acquiredAt: tx.timestamp,
      source: tx.type as CostBasisLot["source"],
    });

    const classification = classifyTransaction(tx);
    if (classification.cubo && classification.category) {
      this.incomes.push({
        transactionId: tx.id,
        timestamp: tx.timestamp,
        asset: tx.asset,
        quantity: tx.quantity,
        fairMarketValueEUR: tx.priceAtTransaction.times(tx.quantity),
        cubo: classification.cubo,
        category: classification.category,
      });
    }
  }

  private handleSell(tx: SanitizedTransaction): void {
    if (tx.quantity.lte(0)) return;
    const { consumed, costBasisTotal } = this.consumeLots(
      tx.asset,
      tx.quantity,
      tx.id
    );
    // Valor de transmisión = lo realmente recibido (total neto de comisiones)
    const proceeds = tx.totalInclFees;
    const gainLoss = proceeds.minus(costBasisTotal);

    this.disposals.push({
      transactionId: tx.id,
      timestamp: tx.timestamp,
      asset: tx.asset,
      quantityDisposed: tx.quantity,
      proceedsEUR: proceeds,
      costBasisEUR: costBasisTotal,
      gainLossEUR: gainLoss,
      lotsConsumed: consumed,
      type: "Sell",
    });
  }

  private handleSend(tx: SanitizedTransaction): void {
    if (tx.quantity.lte(0)) return;
    this.consumeLots(tx.asset, tx.quantity, tx.id);
    this.warnings.push({
      transactionId: tx.id,
      code: "SEND_AS_TRANSFER",
      message: "Send tratado como transferencia no sujeta.",
    });
  }

  private handleConvert(tx: SanitizedTransaction): void {
    if (tx.quantity.lte(0)) return;

    let targetAsset: string | null = tx.convertTargetAsset;
    let targetQuantity: Decimal | null = tx.convertTargetQuantity;

    if (!targetAsset || !targetQuantity || targetQuantity.lte(0)) {
      const parsed = this.parseConvertNotes(tx.notes);
      if (parsed) {
        targetAsset = parsed.targetAsset;
        targetQuantity = parsed.targetQuantity;
      }
    }

    // Valor de transmisión = total neto de comisiones recibido/pagado
    const proceeds = tx.totalInclFees;

    if (!targetAsset || !targetQuantity || targetQuantity.lte(0)) {
      this.warnings.push({
        transactionId: tx.id,
        code: "CONVERT_PARSE_FAILED",
        message: `No se pudo parsear el destino del convert: ${tx.notes}`,
      });
    const { consumed, costBasisTotal, shortfall: _shortfallSell } = this.consumeLots(
      tx.asset,
      tx.quantity,
      tx.id
    );
    void _shortfallSell;
      const gainLoss = proceeds.minus(costBasisTotal);
      this.disposals.push({
        transactionId: tx.id,
        timestamp: tx.timestamp,
        asset: tx.asset,
        quantityDisposed: tx.quantity,
        proceedsEUR: proceeds,
        costBasisEUR: costBasisTotal,
        gainLossEUR: gainLoss,
        lotsConsumed: consumed,
        type: "Convert",
      });
      return;
    }

    // Lado VENTA
    const { consumed, costBasisTotal } = this.consumeLots(
      tx.asset,
      tx.quantity,
      tx.id
    );
    const gainLoss = proceeds.minus(costBasisTotal);
    this.disposals.push({
      transactionId: tx.id,
      timestamp: tx.timestamp,
      asset: tx.asset,
      quantityDisposed: tx.quantity,
      proceedsEUR: proceeds,
      costBasisEUR: costBasisTotal,
      gainLossEUR: gainLoss,
      lotsConsumed: consumed,
      type: "Convert",
    });

    // Lado COMPRA: el nuevo cost basis es el valor de transmisión neto
    const costPerUnit = proceeds.dividedBy(targetQuantity);
    this.addLot({
      id: generateId(),
      asset: targetAsset,
      remainingQuantity: targetQuantity,
      originalQuantity: targetQuantity,
      costPerUnit,
      acquiredAt: tx.timestamp,
      source: "Convert",
    });
  }

  private handleAssetMigration(tx: SanitizedTransaction): void {
    const key = `${tx.timestamp.toISOString()}_${tx.quantity.toString()}`;

    if (tx.direction === "OUT") {
      this.pendingMigrationsOut.set(key, {
        asset: tx.asset,
        quantity: tx.quantity,
      });
    } else if (tx.direction === "IN") {
      const pending = this.pendingMigrationsOut.get(key);
      if (pending) {
        const { consumedDetails, shortfall } = this.consumeLotsDetailed(
          pending.asset,
          pending.quantity,
          tx.id
        );
        for (const detail of consumedDetails) {
          this.addLot({
            id: generateId(),
            asset: tx.asset,
            remainingQuantity: detail.quantityUsed,
            originalQuantity: detail.quantityUsed,
            costPerUnit: detail.costPerUnit,
            acquiredAt: detail.acquiredAt,
            source: "Asset Migration",
          });
        }
        this.pendingMigrationsOut.delete(key);
        if (shortfall.gt(0)) {
          this.warnings.push({
            transactionId: tx.id,
            code: "INSUFFICIENT_LOTS",
            message: `Asset Migration requiere ${tx.quantity.toString()} ${pending.asset} pero faltan lotes.`,
          });
        }
      } else {
        // Sin par: comportarse como Buy
        if (tx.quantity.gt(0)) {
          const costPerUnit = tx.subtotal.dividedBy(tx.quantity);
          this.addLot({
            id: generateId(),
            asset: tx.asset,
            remainingQuantity: tx.quantity,
            originalQuantity: tx.quantity,
            costPerUnit,
            acquiredAt: tx.timestamp,
            source: "Asset Migration",
          });
        }
      }
    }
  }

  // ── Lot Management ──

  private addLot(lot: CostBasisLot): void {
    const list = this.lots.get(lot.asset) ?? [];
    list.push(lot);
    list.sort((a, b) => a.acquiredAt.getTime() - b.acquiredAt.getTime());
    this.lots.set(lot.asset, list);
  }

  private consumeLots(
    asset: string,
    quantity: Decimal,
    transactionId: string
  ): { consumed: LotConsumption[]; costBasisTotal: Decimal; shortfall: Decimal } {
    const result = this.consumeLotsDetailed(asset, quantity, transactionId);
    return {
      consumed: result.consumed,
      costBasisTotal: result.costBasisTotal,
      shortfall: result.shortfall,
    };
  }

  private consumeLotsDetailed(
    asset: string,
    quantity: Decimal,
    transactionId: string
  ): LotConsumptionResult {
    const list = this.lots.get(asset) ?? [];
    const consumed: LotConsumption[] = [];
    const consumedDetails: ConsumedLotDetail[] = [];
    let remaining = quantity;
    let costBasisTotal = ZERO;

    while (remaining.gt(0) && list.length > 0) {
      const lot = list[0];
      const take = lot.remainingQuantity.lte(remaining) ? lot.remainingQuantity : remaining;
      const costBasisUsed = take.times(lot.costPerUnit);

      costBasisTotal = costBasisTotal.plus(costBasisUsed);
      consumed.push({
        lotId: lot.id,
        quantityUsed: take,
        costBasisUsed,
        acquiredAt: lot.acquiredAt,
      });
      consumedDetails.push({
        lotId: lot.id,
        quantityUsed: take,
        costPerUnit: lot.costPerUnit,
        acquiredAt: lot.acquiredAt,
      });

      lot.remainingQuantity = lot.remainingQuantity.minus(take);
      remaining = remaining.minus(take);
      if (lot.remainingQuantity.lte(0)) {
        list.shift();
      }
    }

    if (remaining.gt(0)) {
      // Tolerancia para errores de redondeo del exchange (< 1e-8)
      if (remaining.lt(1e-8)) {
        // Ignorar diferencia insignificante, no generar warning
        remaining = new Decimal("0");
      } else {
        costBasisTotal = costBasisTotal.plus(remaining.times(0));
        this.warnings.push({
          transactionId,
          code: "INSUFFICIENT_LOTS",
          message: `Cantidad insuficiente de ${asset} para cubrir ${quantity.toString()}. Faltante: ${remaining.toString()}`,
        });
      }
    }

    this.lots.set(asset, list);
    return { consumed, consumedDetails, costBasisTotal, shortfall: remaining };
  }

  private parseConvertNotes(
    notes: string
  ): { targetAsset: string; targetQuantity: Decimal } | null {
    const match = notes.match(
      /Converted\s+[\d,.]+\s+\w+\s+to\s+([\d,.]+)\s+(\w+)/i
    );
    if (!match) return null;

    const qtyStr = match[1].replace(/,/g, "");
    const asset = match[2];
    try {
      const targetQuantity = new Decimal(qtyStr);
      if (targetQuantity.lte(0)) return null;
      return { targetAsset: asset, targetQuantity };
    } catch {
      return null;
    }
  }
}
