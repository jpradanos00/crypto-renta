import { create } from "zustand";
import type {
  CoinbaseRawRow,
  CsvFileEntry,
  FiscalYearReport,
  FullHistory,
  AppError,
  SanitizedTransaction,
} from "@/engine/types";

type AppStatus = "idle" | "reviewing" | "parsing" | "calculating" | "done" | "error";

interface AppState {
  // Data
  csvFiles: CsvFileEntry[];
  rawTransactions: CoinbaseRawRow[];

  // UI State
  status: AppStatus;
  progress: { phase: string; percent: number };
  selectedYear: number;
  report: FiscalYearReport | null;
  reports: Map<number, FiscalYearReport>;
  availableYears: number[];
  fullHistory: FullHistory | null;
  errors: AppError[];
  sendDecisions: Map<string, "own" | "third-party">;
  pendingTransactions: SanitizedTransaction[];

  // Actions
  addCsvFile: (file: CsvFileEntry) => void;
  removeCsvFile: (id: string) => void;
  setStatus: (status: AppStatus) => void;
  setProgress: (progress: { phase: string; percent: number }) => void;
  setSelectedYear: (year: number) => void;
  setReport: (report: FiscalYearReport | null) => void;
  setReports: (reports: Map<number, FiscalYearReport>) => void;
  setAvailableYears: (years: number[]) => void;
  setFullHistory: (history: FullHistory | null) => void;
  addError: (error: AppError) => void;
  clearErrors: () => void;
  toggleSendDecision: (txId: string) => void;
  setSendDecisions: (decisions: Map<string, "own" | "third-party">) => void;
  setPendingTransactions: (txs: SanitizedTransaction[]) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  csvFiles: [],
  rawTransactions: [],
  status: "idle",
  progress: { phase: "", percent: 0 },
  selectedYear: new Date().getFullYear() - 1,
  report: null,
  reports: new Map(),
  availableYears: [],
  fullHistory: null,
  errors: [],
  sendDecisions: new Map(),
  pendingTransactions: [],

  addCsvFile: (file) =>
    set((state) => ({ csvFiles: [...state.csvFiles, file] })),

  removeCsvFile: (id) =>
    set((state) => ({
      csvFiles: state.csvFiles.filter((f) => f.id !== id),
    })),

  setStatus: (status) => set({ status }),

  setProgress: (progress) => set({ progress }),

  setSelectedYear: (selectedYear) => set({ selectedYear }),

  setReport: (report) => set({ report }),

  setReports: (reports) => set({ reports }),

  setAvailableYears: (availableYears) => set({ availableYears }),

  setFullHistory: (fullHistory) => set({ fullHistory }),

  addError: (error) =>
    set((state) => ({ errors: [...state.errors, error] })),

  clearErrors: () => set({ errors: [] }),

  toggleSendDecision: (txId) =>
    set((state) => {
      const next = new Map(state.sendDecisions);
      if (next.get(txId) === "third-party") {
        next.delete(txId);
      } else {
        next.set(txId, "third-party");
      }
      return { sendDecisions: next };
    }),

  setSendDecisions: (sendDecisions) => set({ sendDecisions }),

  setPendingTransactions: (pendingTransactions) => set({ pendingTransactions }),

  reset: () =>
    set({
      csvFiles: [],
      rawTransactions: [],
      status: "idle",
      progress: { phase: "", percent: 0 },
      report: null,
      reports: new Map(),
      availableYears: [],
      fullHistory: null,
      errors: [],
      sendDecisions: new Map(),
      pendingTransactions: [],
    }),
}));
