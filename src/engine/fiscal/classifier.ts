import type { SanitizedTransaction, IncomeEvent } from "@/engine/types";

export function classifyTransaction(tx: SanitizedTransaction): {
  cubo: 2 | 3 | null;
  category: IncomeEvent["category"] | null;
} {
  const sender = tx.senderAddress ?? "";

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
      if (sender.includes("Aggregate Rewards")) {
        return { cubo: 2, category: "aggregate_reward" };
      }
      if (sender.includes("Coinbase Earn")) {
        return { cubo: 3, category: "coinbase_earn" };
      }
      if (sender.includes("Flare Airdrop")) {
        return { cubo: 3, category: "airdrop" };
      }
      if (sender.includes("external")) {
        return { cubo: null, category: null };
      }
      return { cubo: null, category: null };
    }
    default:
      return { cubo: null, category: null };
  }
}
