"use client";

import { useAppStore } from "@/store/app-store";

const WARNING_CODE_MAP: Record<string, string> = {
  INSUFFICIENT_LOTS:
    "Faltan lotes (probablemente por redondeo del exchange). Revisa que hayas subido todo el historial.",
  SEND_AS_TRANSFER:
    "Transferencia entre wallets no sujeta a impuestos.",
  SEND_TO_THIRD_PARTY:
    "Envío a tercero marcado como transmisión. Genera ganancia/pérdida patrimonial.",
  UNKNOWN_TRANSACTION_TYPE: "Tipo de transacción no reconocido.",
  CONVERT_PARSE_FAILED: "No se pudo interpretar el destino de un Convert.",
  NEGATIVE_COST_BASIS: "Coste de adquisición negativo detectado.",
  RECEIVE_UNMATCHED:
    "Recepción externa sin transferencia de origen correlada. El coste de adquisición usa el precio de mercado del exchange receptor. Si este activo viene de otro exchange, sube también su CSV.",
};

export function WarningPanel() {
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
          {warnings.length} advertencia{warnings.length === 1 ? "" : "s"} detectada
          {warnings.length === 1 ? "" : "s"}
        </span>
      </summary>
      <ul className="space-y-2 px-4 pb-4">
        {warnings.map((w, i) => (
          <li
            key={`${w.transactionId}-${w.code}-${i}`}
            className="rounded-md bg-background p-3 text-sm border border-border"
          >
            <p className="font-medium text-foreground">
              {WARNING_CODE_MAP[w.code] ?? w.code}
            </p>
            <p className="text-muted-foreground">{w.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Transacción: {w.transactionId}
            </p>
          </li>
        ))}
      </ul>
    </details>
  );
}
