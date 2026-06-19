"use client";

import { useCallback, useRef, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { generateUUID } from "@/lib/uuid";
import type { CsvFileEntry } from "@/engine/types";
import { Upload, FileText, X, ChevronDown, HelpCircle, ExternalLink } from "lucide-react";

interface GuideEntry {
  label: string;
  steps: { text: string; sub?: string }[];
  link: string;
  linkLabel: string;
}

const COINBASE_GUIDE: GuideEntry = {
  label: "Coinbase",
  link: "https://accounts.coinbase.com/statements",
  linkLabel: "Ir a Extractos de Coinbase",
  steps: [
    { text: "Inicia sesión en coinbase.com desde un ordenador" },
    { text: "Ve a Perfil → Extractos e informes" },
    { text: 'Genera un "Historial de transacciones" en CSV', sub: "Rango: todo el historial" },
    { text: "Asegúrate de que la moneda base es EUR", sub: "Imprescindible para el IRPF español" },
  ],
};

export function CsvDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const csvFiles = useAppStore((s) => s.csvFiles);
  const addCsvFile = useAppStore((s) => s.addCsvFile);
  const removeCsvFile = useAppStore((s) => s.removeCsvFile);

  const getFileSignature = (file: File): string =>
    `${file.name}|${file.size}|${file.lastModified}`;

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const csvFiles = Array.from(files).filter((f) =>
        f.name.toLowerCase().endsWith(".csv")
      );
      if (!csvFiles.length) return;

      const existingSigs = new Set(csvFiles.map((f) => getFileSignature(f)));
      let hasDuplicate = false;
      let lastDupName = "";

      for (const file of csvFiles) {
        const sig = getFileSignature(file);
        if (existingSigs.has(sig)) {
          hasDuplicate = true;
          lastDupName = file.name;
        }
      }

      if (hasDuplicate) {
        setDuplicateWarning(`"${lastDupName}" ya ha sido añadido.`);
        setTimeout(() => setDuplicateWarning(null), 3000);
      }

      csvFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const entry: CsvFileEntry = {
            id: generateUUID(),
            name: file.name,
            size: file.size,
            content: String(reader.result ?? ""),
          };
          addCsvFile(entry);
        };
        reader.readAsText(file);
      });
    },
    [addCsvFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <section aria-label="Importar archivos CSV" className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sube tus archivos CSV del exchange
          </p>
          <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
            Compatible con Coinbase
          </span>
        </div>
        <button
          type="button"
          onClick={() => setGuideOpen((v) => !v)}
          aria-expanded={guideOpen}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          ¿No sabes cómo descargar tu CSV?
          {guideOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5 rotate-180" />}
        </button>
      </div>

      {/* Guide panel */}
      {guideOpen && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="border-b border-border bg-muted px-5 py-4">
            <p className="text-sm font-semibold">Cómo exportar tu CSV de Coinbase</p>
          </div>
          <div className="space-y-4 p-5">
            <ol className="space-y-3">
              {COINBASE_GUIDE.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[11px] font-bold text-indigo-400">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm text-foreground">{step.text}</p>
                    {step.sub && <p className="mt-0.5 text-xs text-muted-foreground">{step.sub}</p>}
                  </div>
                </li>
              ))}
            </ol>
            <a
              href={COINBASE_GUIDE.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300"
            >
              {COINBASE_GUIDE.linkLabel}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}

      {/* Duplicate warning */}
      {duplicateWarning && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
          <p className="text-xs text-warning">⚠️ {duplicateWarning}</p>
        </div>
      )}

      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={onKeyDown}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          group relative flex cursor-pointer flex-col items-center justify-center
          gap-5 overflow-hidden rounded-2xl border-2 border-dashed p-14
          text-center transition-all duration-300
          ${isDragging
            ? "border-indigo-500 bg-indigo-500/5"
            : "border-border bg-card/50 hover:border-primary hover:bg-card"
          }
        `}
        aria-label="Zona de carga. Haz clic o arrastra archivos CSV aquí."
      >
        <div className={`
          pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300
          bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5
          ${isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
        `} />

        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          multiple
          aria-hidden
          tabIndex={-1}
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
          className="sr-only"
        />

        <div className={`
          relative flex h-16 w-16 items-center justify-center rounded-2xl
          transition-all duration-300
          ${isDragging
            ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30"
            : "bg-muted group-hover:bg-gradient-to-br group-hover:from-indigo-500/80 group-hover:to-purple-600/80"
          }
        `}>
          <Upload
            aria-hidden
            className={`h-7 w-7 transition-colors ${
              isDragging ? "text-white" : "text-muted-foreground group-hover:text-white"
            }`}
          />
        </div>

        <div className="relative space-y-1.5">
          <p className={`text-base font-semibold transition-colors ${
            isDragging ? "text-indigo-300" : "text-foreground"
          }`}>
            {isDragging ? "Suelta los archivos aquí" : "Arrastra tus CSV aquí"}
          </p>
          <p className="text-sm text-muted-foreground">
            o haz clic para explorar · Múltiples archivos permitidos
          </p>
        </div>

        <span className="relative text-xs text-muted-foreground">Solo archivos .csv</span>
      </div>

      {/* File list */}
      {csvFiles.length > 0 && (
        <>
          <div className="rounded-xl border border-warning/20 bg-warning/5 px-4 py-3">
            <p className="flex items-start gap-2 text-xs text-warning">
              <span className="mt-0.5 shrink-0">⚠</span>
              <span>
                <strong>Sube todo tu historial desde que abriste la cuenta,</strong>{" "}
                no solo del año fiscal. El método FIFO necesita conocer todas tus compras anteriores.
              </span>
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Archivos listos · {csvFiles.length}
            </p>
            <ul aria-label="Archivos a procesar" className="space-y-2">
              {csvFiles.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                    <FileText className="h-4 w-4 text-indigo-400" aria-hidden />
                  </div>
                  <span
                    title={file.name}
                    className="min-w-0 flex-1 truncate text-sm font-medium"
                  >
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">{formatSize(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeCsvFile(file.id)}
                    aria-label={`Eliminar ${file.name}`}
                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
