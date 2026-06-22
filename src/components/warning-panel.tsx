"use client";

import { useAppStore } from "@/store/app-store";
import { useT } from "@/lib/i18n/context";

export function WarningPanel() {
  const { t } = useT();
  const report = useAppStore((s) => s.report);
  const status = useAppStore((s) => s.status);

  if (status !== "done") return null;

  const warnings = report?.warnings ?? [];

  if (warnings.length === 0) {
    return null;
  }

  return (
    <details className="rounded-lg border border-warning/30 bg-warning/10 open:bg-warning/5">
      <summary className="flex cursor-pointer items-center gap-3 p-4 text-sm font-medium text-warning focus:outline-none focus:ring-2 focus:ring-ring rounded-lg">
        <span aria-hidden="true">&#9888;&#65039;</span>
        <span>
          {t("warnings.header", {
            count: warnings.length,
            countPlural: warnings.length === 1 ? "" : "s",
          })}
        </span>
      </summary>
      <ul className="space-y-2 px-4 pb-4">
        {warnings.map((w, i) => (
          <li
            key={`${w.transactionId}-${w.code}-${i}`}
            className="rounded-md bg-background p-3 text-sm border border-border"
          >
            <p className="font-medium text-foreground">
              {t(`warnings.${w.code}` as never, undefined as never) ?? w.code}
            </p>
            <p className="text-muted-foreground">{w.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("warnings.transaction", { id: w.transactionId })}
            </p>
          </li>
        ))}
      </ul>
    </details>
  );
}
