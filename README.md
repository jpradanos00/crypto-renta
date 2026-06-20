# CryptoRenta

**Calculadora fiscal de criptomonedas para el IRPF español.**

Zero‑knowledge, 100% client‑side. Sin servidor, sin telemetría, sin que tus datos salgan del navegador.

---

## Qué hace

Convierte el historial de transacciones de Coinbase en el desglose exacto que necesitas para declarar criptomonedas en la Renta española:

- **Casillas 1800–1814** — Ganancias y pérdidas patrimoniales (Base del Ahorro)
- **Casilla 0027** — Rendimientos del capital mobiliario: staking y recompensas
- **Casillas 0304+** — Otras ganancias: airdrops, Coinbase Earn, etc.

Todo calculado con **FIFO por activo**, **Decimal de precisión arbitraria** (nada de floats de JavaScript) y **zona horaria española** (Europe/Madrid) para el corte de año fiscal.

---

## Cómo usar

### 1. Exporta tu CSV de Coinbase

Ve a **Coinbase → Configuración → Informes → Historial de transacciones** y genera el CSV.

### 2. Arrástralo a la calculadora

Acepta múltiples CSVs. Se deduplican automáticamente por ID de transacción.

### 3. Revisa y copia a Renta Web

La tabla de desglose por moneda está en el formato exacto de **Monedas Virtuales** de Renta Web — copia, pega y listo.

---

## Cómo funciona — lógica fiscal por tipo de transacción

### Buy (Compra de crypto con EUR)

Se crea un lote de coste con el importe total pagado **incluyendo comisiones**.

- `costPerUnit = Total pagado / Cantidad recibida`
- El coste de adquisición incluye fees — Art. 35.2 LIRPF.

### Sell (Venta de crypto por EUR)

Se consumen lotes por orden FIFO y se genera un **DisposalEvent**.

- `proceedsEUR = Total recibido neto de comisiones`
- `gainLossEUR = proceedsEUR − costBasisEUR (FIFO)`
- Las comisiones de venta reducen el valor de transmisión — Art. 35.1 LIRPF.

### Convert / Swap (Cambio de una crypto por otra)

Se desdobla en dos operaciones:

1. **Enajenación:** se vende el activo origen. Ganancia = valor neto − cost basis.
2. **Adquisición:** se compra el activo destino al valor bruto de mercado (subtotal, no el neto tras fees). La comisión del swap se asigna íntegra al lado de la transmisión.

El coste de adquisición del nuevo activo usa el **valor bruto de lo entregado** (Art. 35.2 LIRPF), no el neto tras fees.

### Send / Envío a wallet externa

⚠️ **Por defecto se trata como transferencia a wallet propia.** No genera hecho imponible.

La app consume los lotes (algoritmo FIFO) pero **no genera DisposalEvent**. Aparece un warning para que confirmes que el destino es una wallet de tu propiedad:

- ✅ **Wallet propia:** no se declara. No hay alteración patrimonial — DGT V0807-22.
- ❌ **Pago a tercero:** debes marcarlo manualmente. En ese caso SÍ hay transmisión y se genera DisposalEvent.

Si la transferencia se recibe en otro exchange cuyo CSV también has subido, la app **correlaciona automáticamente** el Send con el Receive usando la dirección de wallet (ver Transferencias cross‑exchange).

### Receive / Recepción

Depende del remitente:

| Remitente | Clasificación | Casilla |
|-----------|---------------|---------|
| Coinbase Earn | Otras ganancias (no transmisión) | 0304+ |
| Flare Airdrop | Otras ganancias (no transmisión) | 0304+ |
| Aggregate Rewards | Rendimiento del capital mobiliario | 0027 |
| External account | Transferencia desde wallet propia | — (no sujeto) |
| Cualquier otro | — (sin clasificar) | — |

Las recepciones externas crean un lote con el precio de mercado del exchange receptor **solo si no se encuentra una transferencia correlacionada**. Si se correlaciona con un Send de otro CSV, se preserva el cost basis original.

### Staking Income / Inflation Reward / Reward Income

Recompensas por staking, inflación del protocolo o rewards del exchange.

- Se valora al precio de mercado del activo en el momento de recepción.
- Clasificado como **Cubo 2** — rendimiento del capital mobiliario (Casilla 0027).
- El coste de adquisición del lote = precio de mercado (lo que ya tributó como ingreso).

### Retail Simple Price Improvement

Micro‑mejoras de precio en operaciones retail de Coinbase (cashback/reembolso en stablecoins).

- Clasificado como **Cubo 2**.
- Se valora a precio de mercado.

### Asset Migration (ej. MATIC → POL)

Migración de token sin contraprestación (rebranding, upgrade de contrato). Se transfieren los lotes preservando el cost basis original. **No genera hecho imponible.**

### Deposit / Withdrawal (EUR)

Entrada y salida de euros (fiat). Ignoradas fiscalmente.

### Retail Staking Transfer / Retail Unstaking Transfer

Movimientos internos de Coinbase entre wallet y pool de staking. Ignorados fiscalmente.

---

## Transferencias cross‑exchange (cómo funciona la correlación)

Cuando subes CSVs de varios exchanges, la app correlaciona automáticamente Sends y Receives para **preservar el cost basis original**.

### Algoritmo de matching

```
Nivel 1 — Determinista (dirección de wallet):
  Send.RecipientAddress == Receive.SenderAddress  +  mismo asset
  → MATCH INMEDIATO. Cost basis preservado.

Nivel 2 — Heurístico (solo si el exchange no proporciona direcciones):
  Mismo asset + misma cantidad (±0.5 %) + ventana temporal (<72 h)
  → MATCH CON WARNING. Verificar manualmente.
```

### Requisitos para nuevos parsers de exchange

Cada parser debe rellenar los campos `senderAddress` y `recipientAddress` del `SanitizedTransaction` si el CSV del exchange los proporciona. Si no, se documenta como limitación y el sistema degrada al nivel 2.

### Ejemplo

```
Kraken:  Send    1 ETH → to 0xABC...     (consume lote original)
Coinbase: Receive 1 ETH ← from 0xABC...   (usa el cost basis original)
Coinbase: Sell    0.5 ETH                 (ganancia calculada con coste real ✓)
```

---

## Exchanges soportados

| Exchange | Estado |
|----------|--------|
| **Coinbase** | ✅ Completo |
| Binance | 🔜 En desarrollo |
| Kraken | 🔜 En desarrollo |

Actualmente la app solo procesa CSVs de Coinbase. La arquitectura está diseñada para que añadir un nuevo exchange sea cuestión de escribir un parser que mapee su formato de columnas a `SanitizedTransaction`.

### ¿Quieres añadir tu exchange?

1. Crea un archivo en `src/engine/parser/tu-exchange.ts` que exporte una función `parse(tuExchange)CSV(csvText: string): CoinbaseRawRow[]`
2. Añade la lógica de mapeo de columnas específicas de tu exchange
3. Si el CSV de tu exchange incluye direcciones de wallet (`sender`/`recipient`), rellena esos campos en el raw row — así la correlación cross‑exchange funcionará con el Nivel 1 (determinista)
4. Añade tests en `tests/engine/` y manda un PR

Consulta [`PLAN.md`](PLAN.md) para ver el roadmap completo de mejoras.

---

## Lo que NO hace (todavía)

- ❌ No calcula la cuota tributaria (tipos progresivos 19–28 %). La app te da los importes; tú aplicas los tipos que correspondan.
- ❌ No aplica la exención de €1,000 para pequeñas ganancias.
- ❌ No genera el borrador de Renta Web — solo el desglose por moneda.

---

## Privacidad

**Tus datos nunca salen de tu navegador.** El CSV se procesa en local con Web Workers. La app es un sitio estático sin backend.

---

## Desarrollo

```bash
npm install
npm run dev      # Servidor de desarrollo
npm test         # Tests (Vitest)
npm run build    # Build de producción (export estático)
```

### Estructura

```
src/
├── engine/
│   ├── fifo/engine.ts     # Motor FIFO
│   ├── fiscal/            # Clasificador y reportero fiscal
│   ├── parser/            # Parser de CSV Coinbase + sanitizer
│   └── worker/            # Pipeline y Web Worker
├── components/            # UI React
├── lib/                   # decimal.js, helpers fiscales
└── store/                 # Zustand
```

### Convenciones

- Todos los cálculos monetarios usan `decimal.js‑light` (precisión 40). **Nunca** usar `number` de JavaScript.
- Los tests están en `tests/`. Ejecutar `npm test` antes de cada PR.
- La zona horaria fiscal es `Europe/Madrid`. No modificar sin verificar el impacto en el cambio de año fiscal.

---

## Licencia

MIT
