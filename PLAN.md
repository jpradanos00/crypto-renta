# PLAN DE CAMBIOS — CryptoRenta

Plan de mejoras derivado de la auditoría fiscal y técnica (2026-06-20).

---

## Resumen de hallazgos

| ID | Severidad | Archivo | Descripción |
|----|-----------|---------|-------------|
| F1 | **CRÍTICO** | `src/engine/fifo/engine.ts:274` | Cost basis del asset destino en `Convert` usa importe neto (totalInclFees) en vez del bruto (subtotal). Art. 35.2 LIRPF: el coste de adquisición debe incluir el valor íntegro de lo entregado a cambio. |
| F2 | **CRÍTICO** | Arquitectura | Pérdida de cost basis original en transfers cross-exchange: Send consume lot con coste real → Receive crea nuevo lot con precio de mercado falso del exchange receptor. |
| F3 | **ALTO** | `src/engine/fiscal/classifier.ts:19-31` | String-matching frágil para clasificar Receives (`sender.includes(...)`). Si Coinbase cambia ligeramente el formato de sender, la clasificación falla silenciosamente devolviendo `cubo: null`. |
| F4 | **MEDIO** | `src/engine/fifo/engine.ts:287` | Clave de emparejamiento de Asset Migration (`timestamp + quantity`) no incluye el activo, riesgo teórico de colisión si dos migraciones distintas comparten timestamp y cantidad. |
| F5 | **MEDIO** | `src/engine/worker/pipeline.ts:41` | Ordenación cronológica no determinista para timestamps idénticos (sin criterio de desempate). |
| F6 | **BAJO** | `src/engine/fiscal/classifier.ts` | Retail Simple Price Improvement genera income events de céntimos (€0.02). Considerar umbral mínimo. |
| F7 | **BAJO** | `src/engine/parser/sanitizer.ts:90` | El campo `source` está hardcodeado a `"coinbase"`. Debe parametrizarse para multi-exchange. |

---

## Cambios planificados

### Fase 1: Correcciones inmediatas (fiscalmente necesarias)

#### F1 — Corregir cost basis en Convert
- **Archivo:** `src/engine/fifo/engine.ts` ~línea 274
- **Cambio:** `costPerUnit = progresses.dividedBy(targetQuantity)` → `costPerUnit = tx.subtotal.dividedBy(targetQuantity)`
- **Fundamento:** Art. 35.2 LIRPF — el valor de adquisición debe ser el importe bruto satisfecho. La fee ya se descuenta del valor de transmisión (disposal side) y no debe reducir también el coste de adquisición.

#### F3 — Robustecer clasificador de Receives
- **Archivo:** `src/engine/fiscal/classifier.ts`
- **Cambio:** Sustituir `sender.includes(...)` por una tabla de patrones con regex. Extraer la lógica a un mapa configurable de `patrón → {cubo, category}`.
- **Razón:** Evitar clasificaciones incorrectas silenciosas si Coinbase modifica el formato.

#### F5 — Añadir desempate en ordenación
- **Archivo:** `src/engine/worker/pipeline.ts` ~línea 41
- **Cambio:** Añadir `|| a.id.localeCompare(b.id)` como criterio de desempate tras timestamp.

### Fase 2: Arquitectura multi-exchange

#### F2 — Sistema de matching cross-exchange para transfers
- **Descripción:** Al procesar un `Send` (OUT), guardar los lotes consumidos como "pendientes de recepción" en un registro de transfers. Al procesar un `Receive` (IN) de otro exchange con asset y cantidad similar (±tolerancia) en una ventana temporal próxima, transferir el cost basis original en lugar de crear un lot nuevo.
- **Componentes nuevos:**
  - `src/engine/transfer/transfer-ledger.ts` — registro de transfers pendientes
  - `src/engine/transfer/matcher.ts` — lógica de matching (asset, cantidad, time window)
- **Impacto:** Crítico para soportar múltiples exchanges sin falsear el cost basis.

#### F7 — Abstracción del parser para multi-exchange
- **Descripción:** Crear interfaz `ExchangeParser` que produzca `SanitizedTransaction[]` directamente. Migrar el parser de Coinbase a esta interfaz. Parametrizar `source`.
- **Archivos nuevos:**
  - `src/engine/parser/types.ts` — interfaz `ExchangeParser`
  - `src/engine/parser/coinbase.ts` — refactorizar para implementar `ExchangeParser`
  - `src/engine/parser/binance.ts` (placeholder)
  - `src/engine/parser/kraken.ts` (placeholder)

### Fase 3: Mejoras menores

#### F4 — Mejorar clave de Asset Migration
- **Archivo:** `src/engine/fifo/engine.ts:287`
- **Cambio:** Añadir `tx.asset` a la clave: `` `${tx.timestamp.toISOString()}_${tx.asset}_${tx.quantity.toString()}` ``

#### F6 — Umbral mínimo para income events
- **Archivo:** `src/engine/fifo/engine.ts` (`handleIncome`)
- **Cambio:** No generar `IncomeEvent` si `fairMarketValueEUR < 0.01` (configurable).

---

## Tratamiento de fees — decisión de diseño documentada

### Staking Income
La app usa `priceAtTransaction * quantity` como valor de mercado del ingreso (subtotal), ignorando la columna `Total` de Coinbase que podría representar la recompensa bruta (antes de la comisión del 31-35% de Coinbase). Esta decisión es conservadora y aceptada por la mayoría de asesores fiscales españoles, pero no está exenta de debate (algunos sostienen que debe declararse el bruto y la comisión como gasto deducible). Se documenta aquí para transparencia.

### Convert fees
La fee de un swap se asigna íntegramente al lado de la transmisión (reduce proceeds), siguiendo Art. 35.1 LIRPF. No se asigna también al lado de la adquisición para evitar doble cómputo. Tras F1, el coste de adquisición del asset destino usará el valor bruto (subtotal), reflejando correctamente el valor íntegro de lo entregado a cambio.

---

## Notas para contribuidores

- Todas las cantidades monetarias usan `decimal.js-light` (precisión 40). No usar `number` de JS para cálculos.
- Los tests están en `tests/` con Vitest. Ejecutar `npm test` antes de cada PR.
- El zone fiscal es `Europe/Madrid`. No modificar sin verificar impacto en el cambio de año.
- La app es 100% client-side (zero-knowledge). No añadir llamadas a servidor ni telemetría.
