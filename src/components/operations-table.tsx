"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store/app-store";
import { formatEUR } from "@/lib/decimal";
import { ChevronDown, ChevronUp, TableProperties } from "lucide-react";
import type { SanitizedTransaction } from "@/engine/types";

const PAGE_SIZE = 50;

export function OperationsTable() {
  const report = useAppStore((s) => s.report);
  const status = useAppStore((s) => s.status);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());

  if (status !== "done") return null;

  if (!report || report.allTransactions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <TableProperties className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold">Sin operaciones</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          No hay transacciones registradas para el año fiscal seleccionado.
        </p>
      </div>
    );
  }

  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    for (const tx of report.allTransactions) {
      sources.add(tx.source);
    }
    return Array.from(sources).sort();
  }, [report.allTransactions]);

  // Initialize selected sources on first load
  useMemo(() => {
    if (selectedSources.size === 0 && uniqueSources.length > 0) {
      setSelectedSources(new Set(uniqueSources));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueSources]);

  const filtered = useMemo(() => {
    return report.allTransactions.filter((tx) => selectedSources.has(tx.source));
  }, [report.allTransactions, selectedSources]);

  const sorted = useMemo(() => {
    const txs = [...filtered];
    txs.sort((a, b) => {
      const diff = a.timestamp.getTime() - b.timestamp.getTime();
      return sortAsc ? diff : -diff;
    });
    return txs;
  }, [filtered, sortAsc]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const currentPage = Math.min(page, totalPages - 1);
  const pageItems = sorted.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  const toggleSort = () => setSortAsc((prev) => !prev);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getCuboForTx = (tx: SanitizedTransaction): string => {
    const type = tx.type;
    if (type === "Sell" || type === "Convert") return "1";
    if (
      type === "Staking Income" ||
      type === "Inflation Reward" ||
      type === "Reward Income" ||
      type === "Retail Simple Price Improvement"
    )
      return "2";
    if (type === "Receive") return "3";
    return "-";
  };

  const gainLossForTx = (tx: SanitizedTransaction): string => {
    if (tx.type !== "Sell" && tx.type !== "Convert") return "-";
    const disposal = report.cubo1.disposals.find(
      (d) => d.transactionId === tx.id
    );
    if (!disposal) return "-";
    return formatEUR(disposal.gainLossEUR);
  };

  const gainLossClass = (tx: SanitizedTransaction): string => {
    if (tx.type !== "Sell" && tx.type !== "Convert") return "";
    const disposal = report.cubo1.disposals.find(
      (d) => d.transactionId === tx.id
    );
    if (!disposal) return "";
    return disposal.gainLossEUR.gte(0) ? "text-gain" : "text-loss";
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between bg-muted px-5 py-4 transition-colors hover:bg-muted/80"
      >
        <div className="flex items-center gap-2.5">
          <TableProperties className="h-4 w-4 text-indigo-400" />
          <span className="text-sm font-semibold">Ver detalle de operaciones</span>
          <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-300">
            {sorted.length}
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Exchange filters */}
          {uniqueSources.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Filtrar por exchange:</span>
              {uniqueSources.map((source) => (
                <label
                  key={source}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs transition-colors hover:bg-muted cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedSources.has(source)}
                    onChange={(e) => {
                      setSelectedSources((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) {
                          next.add(source);
                        } else {
                          next.delete(source);
                        }
                        return next;
                      });
                      setPage(0);
                    }}
                    className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-ring"
                  />
                  <span className="capitalize">{source}</span>
                </label>
              ))}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Tabla de transacciones del año fiscal</caption>
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">
                    <button
                      onClick={toggleSort}
                      className="flex items-center gap-1 font-semibold"
                    >
                      Fecha {sortAsc ? "▲" : "▼"}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">Tipo</th>
                  <th scope="col" className="px-4 py-3 text-left">Exchange</th>
                  <th scope="col" className="px-4 py-3 text-left">Activo</th>
                  <th scope="col" className="px-4 py-3 text-right">Cantidad</th>
                  <th scope="col" className="px-4 py-3 text-right">Valor EUR</th>
                  <th scope="col" className="px-4 py-3 text-right">Gan/Pérd</th>
                  <th scope="col" className="px-4 py-3 text-center">Box</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageItems.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(tx.timestamp)}</td>
                    <td className="px-4 py-3">{tx.type}</td>
                    <td className="px-4 py-3 capitalize">{tx.source}</td>
                    <td className="px-4 py-3 font-medium">{tx.asset}</td>
                    <td className="px-4 py-3 text-right font-mono-nums">{tx.quantity.toString()}</td>
                    <td className="px-4 py-3 text-right font-mono-nums">{formatEUR(tx.totalInclFees)}</td>
                    <td className={`px-4 py-3 text-right font-mono-nums ${gainLossClass(tx)}`}>
                      {gainLossForTx(tx)}
                    </td>
                    <td className="px-4 py-3 text-center">{getCuboForTx(tx)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-muted-foreground">
              Página {currentPage + 1} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
