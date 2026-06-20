import { d, Decimal } from "@/lib/decimal";
import type { PendingTransfer, ReceiveMatchQuery, TransferLot } from "./types";

const MAX_HOURS_WINDOW = 72;
const QUANTITY_TOLERANCE = 0.005; // ±0.5%

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export class TransferLedger {
  private pending: PendingTransfer[] = [];

  save(
    asset: string,
    quantity: Decimal,
    timestamp: Date,
    sourceExchange: string,
    recipientAddress: string | null,
    lots: TransferLot[]
  ): void {
    if (quantity.lte(0)) return;
    this.pending.push({
      id: generateId(),
      asset,
      quantity,
      timestamp,
      sourceExchange,
      recipientAddress,
      lots,
    });
  }

  findMatch(query: ReceiveMatchQuery): PendingTransfer | null {
    // Nivel 1 — Determinista: match por dirección de wallet
    // Solo se aplica si AMBAS partes tienen dirección.
    // Si una tiene dirección y la otra no, se degrada al nivel 2.
    if (query.senderAddress) {
      const addrMatch = this.pending.find(
        (t) =>
          t.recipientAddress &&
          t.recipientAddress === query.senderAddress &&
          t.asset === query.asset
      );
      if (addrMatch) {
        this.removePending(addrMatch.id);
        return addrMatch;
      }

      // Si el query tiene address pero ningún pending tiene address,
      // seguimos al nivel 2. Pero si algún pending SÍ tiene address
      // y no coincide, NO debe caer al nivel 2.
      const anyWithAddress = this.pending.some(
        (t) => t.recipientAddress && t.asset === query.asset
      );
      if (anyWithAddress) return null;
    }

    // Nivel 2 — Heurístico (fallback): solo cuando no hay direcciones disponibles
    const candidates = this.pending
      .filter((t) => t.asset === query.asset)
      .filter((t) => t.timestamp.getTime() <= query.timestamp.getTime())
      .filter((t) => {
        const hours =
          (query.timestamp.getTime() - t.timestamp.getTime()) / 3600000;
        return hours <= MAX_HOURS_WINDOW;
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    for (const candidate of candidates) {
      if (candidate.quantity.gte(query.quantity)) {
        const ratio = query.quantity.dividedBy(candidate.quantity);
        if (ratio.gte(d(1 - QUANTITY_TOLERANCE))) {
          this.removePending(candidate.id);
          return candidate;
        }
      }
    }

    return null;
  }

  getPending(): PendingTransfer[] {
    return [...this.pending];
  }

  private removePending(id: string): void {
    this.pending = this.pending.filter((t) => t.id !== id);
  }
}
