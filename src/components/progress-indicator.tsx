"use client";

import { useAppStore } from "@/store/app-store";
import { useT } from "@/lib/i18n/context";
import { Loader2 } from "lucide-react";

export function ProgressIndicator() {
  const { t } = useT();
  const progress = useAppStore((s) => s.progress);
  const status = useAppStore((s) => s.status);

  if (status !== "calculating") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t("progress.ariaLabel")}
      className="flex min-h-[360px] flex-col items-center justify-center gap-8
                 rounded-2xl border border-border bg-card p-12"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl" />
        <Loader2 aria-hidden className="relative h-12 w-12 animate-spin text-indigo-400" />
      </div>

      <div className="w-full max-w-xs space-y-2.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="truncate pr-4">{progress.phase}</span>
          <span className="shrink-0 tabular-nums">{progress.percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("progress.calculating")}
      </p>
    </div>
  );
}
