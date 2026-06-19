import { ZERO } from "@/lib/decimal";
import type {
  FiscalYearReport,
  DisposalEvent,
  IncomeEvent,
  SanitizedTransaction,
  CalculationWarning,
} from "@/engine/types";

/**
 * Devuelve el año fiscal español (zona horaria Europe/Madrid)
 * para un timestamp UTC de Coinbase.
 * España usa CET (UTC+1) en invierno y CEST (UTC+2) en verano.
 */
function getSpanishYear(date: Date): number {
  try {
    return parseInt(
      date.toLocaleString("en-US", {
        timeZone: "Europe/Madrid",
        year: "numeric",
      }),
      10
    );
  } catch {
    // Fallback: añadir offset máximo (UTC+2) para evitar errores de corte de año
    const offsetMs = 2 * 60 * 60 * 1000;
    return new Date(date.getTime() + offsetMs).getUTCFullYear();
  }
}

export function buildFiscalYearReport(
  year: number,
  disposals: DisposalEvent[],
  incomes: IncomeEvent[],
  transactions: SanitizedTransaction[],
  warnings: CalculationWarning[]
): FiscalYearReport {
  const yearDisposals = disposals.filter(
    (d) => getSpanishYear(d.timestamp) === year
  );
  const yearIncomes = incomes.filter(
    (i) => getSpanishYear(i.timestamp) === year
  );

  let totalGains = ZERO;
  let totalLosses = ZERO;

  for (const d of yearDisposals) {
    if (d.gainLossEUR.greaterThan(0)) {
      totalGains = totalGains.plus(d.gainLossEUR);
    } else {
      totalLosses = totalLosses.plus(d.gainLossEUR.abs());
    }
  }

  const cubo2Incomes = yearIncomes.filter((i) => i.cubo === 2);
  const cubo3Incomes = yearIncomes.filter((i) => i.cubo === 3);

  let totalIncomeCubo2 = ZERO;
  for (const i of cubo2Incomes) {
    totalIncomeCubo2 = totalIncomeCubo2.plus(i.fairMarketValueEUR);
  }

  let totalIncomeCubo3 = ZERO;
  for (const i of cubo3Incomes) {
    totalIncomeCubo3 = totalIncomeCubo3.plus(i.fairMarketValueEUR);
  }

  return {
    year,
    cubo1: {
      disposals: yearDisposals,
      totalGainsEUR: totalGains,
      totalLossesEUR: totalLosses,
      netGainLossEUR: totalGains.minus(totalLosses),
    },
    cubo2: {
      incomes: cubo2Incomes,
      totalIncomeEUR: totalIncomeCubo2,
    },
    cubo3: {
      incomes: cubo3Incomes,
      totalIncomeEUR: totalIncomeCubo3,
    },
    allTransactions: transactions,
    warnings,
  };
}

export function buildFiscalYearReports(
  disposals: DisposalEvent[],
  incomes: IncomeEvent[],
  transactions: SanitizedTransaction[],
  warnings: CalculationWarning[]
): Map<number, FiscalYearReport> {
  const years = new Set<number>();
  for (const d of disposals) years.add(getSpanishYear(d.timestamp));
  for (const i of incomes) years.add(getSpanishYear(i.timestamp));

  const reports = new Map<number, FiscalYearReport>();
  for (const year of years) {
    reports.set(
      year,
      buildFiscalYearReport(year, disposals, incomes, transactions, warnings)
    );
  }
  return reports;
}
