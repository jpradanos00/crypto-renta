import { Decimal } from "@/lib/decimal";

export interface TransferLot {
  costPerUnit: Decimal;
  quantityUsed: Decimal;
  acquiredAt: Date;
}

export interface PendingTransfer {
  id: string;
  asset: string;
  quantity: Decimal;
  timestamp: Date;
  sourceExchange: string;
  recipientAddress: string | null;
  lots: TransferLot[];
}

export interface ReceiveMatchQuery {
  asset: string;
  quantity: Decimal;
  timestamp: Date;
  senderAddress: string | null;
}
