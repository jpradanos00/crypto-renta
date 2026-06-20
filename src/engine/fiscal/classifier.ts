import type { SanitizedTransaction, IncomeEvent } from "@/engine/types";

interface ReceiveRule {
  pattern: RegExp;
  cubo: 2 | 3 | null;
  category: IncomeEvent["category"] | null;
}

/**
 * Tabla de clasificación para transacciones Receive.
 * Las reglas se evalúan en orden; la primera que coincida gana.
 * Usa regex anclados (^...$) para evitar falsos positivos.
 * Para añadir un nuevo patrón basta con agregar una entrada aquí.
 */
const RECEIVE_RULES: ReceiveRule[] = [
  {
    pattern: /^Coinbase Earn$/i,
    cubo: 3,
    category: "coinbase_earn",
  },
  {
    pattern: /^Flare Airdrop$/i,
    cubo: 3,
    category: "airdrop",
  },
  {
    pattern: /^Aggregate Rewards$/i,
    cubo: 2,
    category: "aggregate_reward",
  },
  {
    pattern: /^an external account$/i,
    cubo: null,
    category: null,
  },
  // Futuros exchanges / patrones aquí
];

export function classifyTransaction(tx: SanitizedTransaction): {
  cubo: 2 | 3 | null;
  category: IncomeEvent["category"] | null;
} {
  switch (tx.type) {
    case "Staking Income":
      return { cubo: 2, category: "staking" };
    case "Inflation Reward":
      return { cubo: 2, category: "inflation_reward" };
    case "Reward Income":
      return { cubo: 2, category: "reward_income" };
    case "Retail Simple Price Improvement":
      return { cubo: 2, category: "price_improvement" };
    case "Receive": {
      const sender = tx.senderAddress ?? "";
      for (const rule of RECEIVE_RULES) {
        if (rule.pattern.test(sender)) {
          return { cubo: rule.cubo, category: rule.category };
        }
      }
      return { cubo: null, category: null };
    }
    default:
      return { cubo: null, category: null };
  }
}
