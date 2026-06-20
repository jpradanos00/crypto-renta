"use client";

import { useCallback } from "react";
import { useAppStore } from "@/store/app-store";
import { generateUUID } from "@/lib/uuid";
import { prepareCSVs, processCSVsInMainThread } from "@/engine/worker/bridge-fallback";
import { CsvDropzone } from "@/components/csv-dropzone";
import { ReviewScreen } from "@/components/review-screen";
import { YearSelector } from "@/components/year-selector";
import { ProgressIndicator } from "@/components/progress-indicator";
import { ResultsDashboard } from "@/components/results-dashboard";
import { OperationsTable } from "@/components/operations-table";
import { WarningPanel } from "@/components/warning-panel";
import { ExportButtons } from "@/components/export-buttons";
import { Calculator, RotateCcw, Shield, ArrowRight, Eye } from "lucide-react";
import type { DisposalEvent, IncomeEvent } from "@/engine/types";

export function CalculadoraClient() {
  const csvFiles = useAppStore((s) => s.csvFiles);
  const status = useAppStore((s) => s.status);
  const setStatus = useAppStore((s) => s.setStatus);
  const setProgress = useAppStore((s) => s.setProgress);
  const setReport = useAppStore((s) => s.setReport);
  const setReports = useAppStore((s) => s.setReports);
  const setAvailableYears = useAppStore((s) => s.setAvailableYears);
  const setFullHistory = useAppStore((s) => s.setFullHistory);
  const addError = useAppStore((s) => s.addError);
  const reset = useAppStore((s) => s.reset);
  const setPendingTransactions = useAppStore((s) => s.setPendingTransactions);

  const handleReview = useCallback(() => {
    if (csvFiles.length === 0) return;
    const csvTexts = csvFiles.map((f) => f.content);
    try {
      const transactions = prepareCSVs(csvTexts);
      setPendingTransactions(transactions);
      setStatus("reviewing");
    } catch (err) {
      addError({ id: generateUUID(), message: String(err) });
      setStatus("error");
    }
  }, [csvFiles, setStatus, setPendingTransactions, addError]);

  const handleCalculate = useCallback(async () => {
    const txs = useAppStore.getState().pendingTransactions;
    const decisions = useAppStore.getState().sendDecisions;
    if (txs.length === 0) return;

    setStatus("calculating");
    setProgress({ phase: "Iniciando...", percent: 0 });

    try {
      const result = await processCSVsInMainThread(txs, decisions, (progress) => {
        setProgress({ phase: progress.message, percent: progress.percent });
      });

      const latestYear =
        result.availableYears[result.availableYears.length - 1] ??
        new Date().getFullYear() - 1;

      setReports(result.reports);
      setAvailableYears(result.availableYears);
      setReport(result.reports.get(latestYear) ?? null);

      const allDisposals: DisposalEvent[] = [];
      const allIncomes: IncomeEvent[] = [];
      for (const yr of result.availableYears) {
        const r = result.reports.get(yr)!;
        allDisposals.push(...r.cubo1.disposals);
        allIncomes.push(...r.cubo2.incomes, ...r.cubo3.incomes);
      }
      setFullHistory({
        portfolioSnapshot: result.portfolioSnapshot,
        allDisposals,
        allIncomes,
      });
      setStatus("done");
    } catch (err) {
      addError({ id: generateUUID(), message: String(err) });
      setStatus("error");
    }
  }, [setStatus, setProgress, setReport, setReports, setAvailableYears, setFullHistory, addError]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  const hasFiles = csvFiles.length > 0;
  const isReviewing = status === "reviewing";
  const isCalculating = status === "calculating";
  const isDone = status === "done";
  const isError = status === "error";

  return (
    <div className="space-y-10">
      {/* ── Upload ── */}
      {(!isDone && !isCalculating && !isReviewing) && (
        <section aria-label="Importar archivos CSV" className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Declara tus criptomonedas sin sorpresas
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
              Sube los CSV de Coinbase. El motor FIFO calcula tus ganancias y
              pérdidas patrimoniales según la normativa de la AEAT.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1">
              <Shield className="h-3.5 w-3.5 text-gain" />
              <span className="text-xs font-medium text-gain">
                SPA · Zero Knowledge · Tus datos nunca salen de tu dispositivo
              </span>
            </div>
          </div>

          <CsvDropzone />

          {hasFiles && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleReview}
                className="flex w-full items-center justify-center gap-2.5
                           rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600
                           px-5 py-3.5 text-sm font-bold text-white shadow-lg
                           shadow-indigo-500/20 transition-all duration-200
                           hover:from-indigo-500 hover:to-purple-500
                           hover:shadow-indigo-500/30
                           focus:outline-none focus:ring-2 focus:ring-indigo-500
                           focus:ring-offset-2 focus:ring-offset-background
                           active:scale-[0.99]"
              >
                <Eye className="h-4 w-4" />
                Revisar transacciones · {csvFiles.length}{" "}
                {csvFiles.length === 1 ? "archivo" : "archivos"}
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── Review ── */}
      {isReviewing && (
        <div className="space-y-6">
          <ReviewScreen />

          <div className="flex items-center gap-3 justify-center">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-border px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              ⬅ Volver
            </button>
            <button
              type="button"
              onClick={handleCalculate}
              className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600
                         px-6 py-3 text-sm font-bold text-white shadow-lg
                         shadow-indigo-500/20 transition-all duration-200
                         hover:from-indigo-500 hover:to-purple-500
                         hover:shadow-indigo-500/30
                         focus:outline-none focus:ring-2 focus:ring-indigo-500
                         focus:ring-offset-2 focus:ring-offset-background
                         active:scale-[0.99]"
            >
              <Calculator className="h-4 w-4" />
              Calcular IRPF
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Calculating ── */}
      {isCalculating && (
        <section className="space-y-4">
          <ProgressIndicator />
        </section>
      )}

      {/* ── Error ── */}
      {isError && (
        <div
          role="alert"
          className="flex min-h-[200px] flex-col items-center justify-center gap-5
                     rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center"
        >
          <div className="rounded-full bg-destructive/20 p-3">
            <svg className="h-6 w-6 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-destructive">Error al procesar</p>
            <p className="mt-1 text-xs text-destructive/60">
              Ha ocurrido un error durante el cálculo. Revisa los datos e inténtalo de nuevo.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-destructive/30 px-5 py-2 text-sm text-destructive
                       transition-colors hover:bg-destructive/20
                       focus:outline-none focus:ring-2 focus:ring-destructive"
          >
            Intentar de nuevo
          </button>
        </div>
      )}

      {/* ── Results ── */}
      {isDone && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Resultados fiscales</h2>
              <p className="text-sm text-muted-foreground">
                Traslada estos importes a Renta Web. Hacienda aplica los porcentajes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <YearSelector />
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Volver a empezar
              </button>
            </div>
          </div>

          <ResultsDashboard />
          <ExportButtons />
          <WarningPanel />
          <OperationsTable />
        </div>
      )}
    </div>
  );
}
