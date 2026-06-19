import Decimal from "decimal.js-light";

// Configure decimal.js-light for financial precision
Decimal.config({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9,
  toExpPos: 21,
});

export { Decimal };

export const ZERO = d("0");
export const ONE = d("1");

/**
 * Create a Decimal from a string, number, or Decimal.
 * Prefer strings to avoid floating-point precision issues.
 */
export function d(value: string | Decimal): Decimal {
  if (value instanceof Decimal) return value;
  return new Decimal(value);
}

/**
 * Strip euro symbol and commas from a monetary string.
 * Handles: "€0.9836", "-€265.91487", "€1,234.56"
 */
export function stripEuro(value: string): string {
  return value
    .replace(/[\u20ac\s]/g, "") // Remove € and spaces
    .replace(/,/g, ""); // Remove thousands separators
}

/**
 * Parse a monetary value from a Coinbase CSV field into a Decimal.
 */
export function parseMoney(value: string): Decimal {
  const cleaned = stripEuro(value);
  return d(cleaned);
}

/**
 * Format a Decimal as EUR string with 2 decimal places.
 * Use ONLY for final display, never for intermediate calculations.
 */
export function formatEUR(value: Decimal): string {
  return `€${value.toFixed(2)}`;
}
