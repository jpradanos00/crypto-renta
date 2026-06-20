import { d, stripEuro } from "@/lib/decimal";
import type {
  CoinbaseRawRow,
  SanitizedTransaction,
  TransactionType,
} from "@/engine/types";

const VALID_TRANSACTION_TYPES = new Set<string>([
  "Buy",
  "Sell",
  "Convert",
  "Send",
  "Deposit",
  "Withdrawal",
  "Staking Income",
  "Inflation Reward",
  "Reward Income",
  "Retail Unstaking Transfer",
  "Retail Staking Transfer",
  "Retail Simple Price Improvement",
  "Asset Migration",
  "Receive",
]);

export function sanitizeTransactions(
  rawRows: CoinbaseRawRow[],
  source = "coinbase"
): SanitizedTransaction[] {
  const sanitized: SanitizedTransaction[] = [];

  for (const row of rawRows) {
    if (!row.ID || !row.Timestamp || !row["Transaction Type"] || !row.Asset) {
      console.warn("Fila descartada por falta de campos obligatorios:", row);
      continue;
    }

    const txType = row["Transaction Type"];
    if (!VALID_TRANSACTION_TYPES.has(txType)) {
      console.warn(`Tipo de transacción desconocido descartado: ${txType}`);
      continue;
    }

    const timestamp = new Date(row.Timestamp.replace(" UTC", "Z"));
    const qtyStr = row["Quantity Transacted"].trim();
    const direction = qtyStr.startsWith("-") ? "OUT" : "IN";
    const quantity = d(qtyStr.replace(/^-/, ""));

    const priceAtTransaction = d(stripEuro(row["Price at Transaction"]));
    const subtotal = d(stripEuro(row.Subtotal));
    const totalInclFees = d(
      stripEuro(row["Total (inclusive of fees and/or spread)"])
    );
    const fees = d(stripEuro(row["Fees and/or Spread"])).abs();

    const notes = row.Notes ?? "";
    let convertTargetAsset: string | null = null;
    let convertTargetQuantity = null;

    if (txType === "Convert") {
      // Soporta cantidades con comas como separadores de miles
      const match = notes.match(
        /Converted\s+[\d,.]+\s+\w+\s+to\s+([\d,.]+)\s+(\w+)/i
      );
      if (match) {
        const qtyStr = match[1].replace(/,/g, "");
        convertTargetQuantity = d(qtyStr);
        convertTargetAsset = match[2];
      }
    }

    const senderAddress = row["Sender Address"]?.trim() || null;
    const recipientAddress = row["Recipient Address"]?.trim() || null;

    sanitized.push({
      id: row.ID,
      timestamp,
      type: txType as TransactionType,
      asset: row.Asset,
      quantity,
      direction,
      priceCurrency: "EUR",
      priceAtTransaction,
      subtotal,
      totalInclFees,
      fees,
      notes,
      senderAddress,
      recipientAddress,
      convertTargetAsset,
      convertTargetQuantity,
      source,
    });
  }

  return sanitized;
}
