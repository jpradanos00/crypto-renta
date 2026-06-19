import { Decimal } from "@/lib/decimal";

// ── Raw CSV Row (post-parse, pre-sanitization) ──
export interface CoinbaseRawRow {
  ID: string;
  Timestamp: string;
  "Transaction Type": string;
  Asset: string;
  "Quantity Transacted": string;
  "Price Currency": string;
  "Price at Transaction": string;
  Subtotal: string;
  "Total (inclusive of fees and/or spread)": string;
  "Fees and/or Spread": string;
  Notes: string;
  "Sender Address"?: string;
  "Recipient Address"?: string;
}

export type TransactionType =
  | "Buy"
  | "Sell"
  | "Convert"
  | "Send"
  | "Deposit"
  | "Withdrawal"
  | "Staking Income"
  | "Inflation Reward"
  | "Reward Income"
  | "Retail Unstaking Transfer"
  | "Retail Staking Transfer"
  | "Retail Simple Price Improvement"
  | "Asset Migration"
  | "Receive";

export type Direction = "IN" | "OUT";

// ── Sanitized Transaction ──
export interface SanitizedTransaction {
  id: string;
  timestamp: Date;
  type: TransactionType;
  asset: string;
  quantity: Decimal;
  direction: Direction;
  priceCurrency: "EUR";
  priceAtTransaction: Decimal;
  subtotal: Decimal;
  totalInclFees: Decimal;
  fees: Decimal;
  notes: string;
  senderAddress: string | null;
  recipientAddress: string | null;
  convertTargetAsset: string | null;
  convertTargetQuantity: Decimal | null;
  /** Exchange or wallet source that produced this CSV row */
  source: string;
}

// ── FIFO Lot ──
export interface CostBasisLot {
  id: string;
  asset: string;
  remainingQuantity: Decimal;
  originalQuantity: Decimal;
  costPerUnit: Decimal;
  acquiredAt: Date;
  source:
    | "Buy"
    | "Convert"
    | "Receive"
    | "Staking Income"
    | "Inflation Reward"
    | "Reward Income"
    | "Asset Migration"
    | "Retail Simple Price Improvement";
}

// ── Disposal Event (Cubo 1) ──
export interface DisposalEvent {
  transactionId: string;
  timestamp: Date;
  asset: string;
  quantityDisposed: Decimal;
  proceedsEUR: Decimal;
  costBasisEUR: Decimal;
  gainLossEUR: Decimal;
  lotsConsumed: LotConsumption[];
  type: "Sell" | "Convert";
}

export interface LotConsumption {
  lotId: string;
  quantityUsed: Decimal;
  costBasisUsed: Decimal;
  acquiredAt: Date;
}

// ── Income Event (Cubo 2 & 3) ──
export interface IncomeEvent {
  transactionId: string;
  timestamp: Date;
  asset: string;
  quantity: Decimal;
  fairMarketValueEUR: Decimal;
  cubo: 2 | 3;
  category:
    | "staking"
    | "inflation_reward"
    | "reward_income"
    | "aggregate_reward"
    | "coinbase_earn"
    | "airdrop"
    | "price_improvement";
}

// ── Warnings ──
export type WarningCode =
  | "INSUFFICIENT_LOTS"
  | "SEND_AS_TRANSFER"
  | "UNKNOWN_TRANSACTION_TYPE"
  | "CONVERT_PARSE_FAILED"
  | "NEGATIVE_COST_BASIS";

export interface CalculationWarning {
  transactionId: string;
  code: WarningCode;
  message: string;
}

// ── Asset Breakdown (Cubo 1 per-asset for Renta Web) ──
export interface AssetBreakdown {
  asset: string;
  transmissionValueEUR: Decimal;
  acquisitionValueEUR: Decimal;
  profitOrLossEUR: Decimal;
  transactionsCount: number;
}

// ── Fiscal Year Report ──
export interface FiscalYearReport {
  year: number;
  cubo1: {
    disposals: DisposalEvent[];
    totalGainsEUR: Decimal;
    totalLossesEUR: Decimal;
    netGainLossEUR: Decimal;
  };
  cubo2: {
    incomes: IncomeEvent[];
    totalIncomeEUR: Decimal;
  };
  cubo3: {
    incomes: IncomeEvent[];
    totalIncomeEUR: Decimal;
  };
  allTransactions: SanitizedTransaction[];
  warnings: CalculationWarning[];
}

// ── Full History (all years combined) ──
export interface FullHistory {
  portfolioSnapshot: Map<string, CostBasisLot[]>;
  allDisposals: DisposalEvent[];
  allIncomes: IncomeEvent[];
}

// ── App-level error ──
export interface AppError {
  id: string;
  message: string;
  code?: string;
}

// ── CSV File Entry (UI metadata) ──
export interface CsvFileEntry {
  id: string;
  name: string;
  size: number;
  content: string;
}
