# PLAN DE CAMBIOS — CryptoRenta

Plan de mejoras derivado de la auditoría fiscal y técnica (2026-06-20). Actualizado conforme se implementan fases.

---

## Resumen de hallazgos

| ID | Severidad | Archivo | Descripción | Estado |
|----|-----------|---------|-------------|--------|
| B0 | **ALTO** | `src/engine/fifo/engine.ts:400` | `lt(1e-8)` → `lte(1e-8)` para tolerar redondeos exactos de 1e-8 | ✅ Fase 1 |
| F1 | **CRÍTICO** | `src/engine/fifo/engine.ts:274` | Cost basis del asset destino en `Convert` usa importe neto (totalInclFees) en vez del bruto (subtotal). Art. 35.2 LIRPF. | ✅ Fase 1 |
| F2 | **CRÍTICO** | Arquitectura | Pérdida de cost basis original en transfers cross-exchange: Send consume lot con coste real → Receive crea nuevo lot con precio de mercado falso del exchange receptor. | 🟡 Fase 2 (TransferLedger ✓, UI pendiente) |
| F3 | **ALTO** | `src/engine/fiscal/classifier.ts` | String-matching frágil para clasificar Receives (`sender.includes(...)`). | ✅ Fase 3 |
| F4 | **MEDIO** | `src/engine/fifo/engine.ts:287` | Clave de emparejamiento de Asset Migration (`timestamp + quantity`) no incluye el activo, riesgo teórico de colisión. | ⬜ No aplicable — la migración cambia el activo, no se puede incluir en clave |
| F5 | **MEDIO** | `src/engine/worker/pipeline.ts:41` | Ordenación cronológica no determinista para timestamps idénticos (sin criterio de desempate). | ✅ Fase 3 |
| F6 | **BAJO** | `src/engine/fifo/engine.ts` | Retail Simple Price Improvement genera income events de céntimos (€0.02). | ✅ Fase 4 |
| F7 | **BAJO** | `src/engine/parser/sanitizer.ts:90` | El campo `source` está hardcodeado a `"coinbase"`. | ✅ Fase 4 |

---

## Cambios planificados

### ✅ Fase 1: Correcciones inmediatas (completada — 2026-06-20)

#### B0 — Fix INSUFFICIENT_LOTS false positive
- **Archivo:** `src/engine/fifo/engine.ts:400`
- **Cambio:** `remaining.lt(1e-8)` → `remaining.lte(1e-8)`
- **Razón:** Diferencias de exactamente 1e-8 generaban warning falso.

#### F1 — Corregir cost basis en Convert
- **Archivo:** `src/engine/fifo/engine.ts:273-274`
- **Cambio:** `costPerUnit = proceeds.dividedBy(targetQuantity)` → `costPerUnit = tx.subtotal.dividedBy(targetQuantity)`
- **Fundamento:** Art. 35.2 LIRPF — el valor de adquisición debe ser el importe bruto satisfecho. La fee ya se descuenta del valor de transmisión (disposal side) y no debe reducir también el coste de adquisición.

### 🟡 Fase 2: Arquitectura multi-exchange (en progreso)

#### F2 — Sistema de matching cross-exchange para transfers
- **Nuevo módulo:** `src/engine/transfer/`
  - `types.ts` — `PendingTransfer`, `TransferLot`, `ReceiveMatchQuery`
  - `ledger.ts` — `TransferLedger` con algoritmo de matching en dos niveles:
    - **Nivel 1 (determinista):** `Send.RecipientAddress == Receive.SenderAddress` → match inmediato
    - **Nivel 2 (heurístico, fallback):** timestamp + asset + cantidad (±0.5%, ventana 72h) → match con warning
- **Integración en `FIFOEngine`:**
  - `handleSend`: guarda lotes consumidos en `TransferLedger`
  - `handleReceive`: antes de crear lote con precio de mercado, busca en `TransferLedger`. Si match → preserva cost basis original.
- **Nuevo warning:** `RECEIVE_UNMATCHED` — recepción externa sin transferencia correlada
- **Nuevo warning:** `SEND_TO_THIRD_PARTY` — para futuro soporte de Send a tercero (UI)
- **Pendiente:** UI — checkbox en `operations-table` para que el usuario marque Sends como "Wallet propia" (por defecto) o "Pago a tercero"

### ✅ Fase 3: Robustez (completada — 2026-06-20)

#### F3 — Robustecer clasificador de Receives
- **Archivo:** `src/engine/fiscal/classifier.ts`
- **Cambio:** Sustituido `sender.includes(...)` por tabla `RECEIVE_RULES` con `RegExp` anclados (`^...$`).
- **Ventaja:** Si Coinbase cambia el formato, solo hay que añadir/modificar un patrón. Sin riesgo de falsos positivos.

#### F5 — Añadir desempate en ordenación
- **Archivo:** `src/engine/worker/pipeline.ts:41`
- **Cambio:** `|| a.id.localeCompare(b.id)` como criterio de desempate tras timestamp.

#### F4 — Descartado
- La migración de activos cambia el token (MATIC → POL, BTC → BCH). No se puede usar el asset como parte de la clave de emparejamiento porque difiere entre OUT e IN. El riesgo de colisión con timestamp + cantidad es ínfimo en la práctica.

### ✅ Fase 4: Mejoras menores (completada — 2026-06-20)

#### F6 — Umbral mínimo para income events
- **Archivo:** `src/engine/fifo/engine.ts` (`handleIncome`)
- **Cambio:** No genera `IncomeEvent` si `fairMarketValueEUR < €0.01`. El lote se crea igualmente (el activo se adquirió).

#### F7 — Parametrizar source
- **Archivo:** `src/engine/parser/sanitizer.ts:25`
- **Cambio:** `sanitizeTransactions(rawRows, source = "coinbase")` — acepta parámetro `source` con default `"coinbase"`.

---

## Tratamiento de fees — decisión de diseño documentada

### Staking Income
La app usa `priceAtTransaction * quantity` como valor de mercado del ingreso (subtotal), ignorando la columna `Total` de Coinbase que podría representar la recompensa bruta (antes de la comisión del 31-35% de Coinbase). Esta decisión es conservadora y aceptada por la mayoría de asesores fiscales españoles, pero no está exenta de debate.

### Convert fees
La fee de un swap se asigna íntegramente al lado de la transmisión (reduce proceeds), siguiendo Art. 35.1 LIRPF. Tras F1, el coste de adquisición del asset destino usa el valor bruto (subtotal), reflejando correctamente el valor íntegro de lo entregado a cambio.

---

## Notas para contribuidores

- Todas las cantidades monetarias usan `decimal.js-light` (precisión 40). No usar `number` de JS para cálculos.
- Los tests están en `tests/` con Vitest. Ejecutar `npm test` antes de cada PR.
- El zone fiscal es `Europe/Madrid`. No modificar sin verificar impacto en el cambio de año.
- La app es 100% client-side (zero-knowledge). No añadir llamadas a servidor ni telemetría.
