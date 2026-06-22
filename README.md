# 🧮 CryptoRenta

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Decimal.js](https://img.shields.io/badge/precisi%C3%B3n-40%20decimales-purple)](https://github.com/MikeMcl/decimal.js-light)

**Calculadora de impuestos de criptomonedas para el IRPF español. 100% privada, gratuita y open source.**

> ¿Harto de pagar 200€ por Koinly o Cointracker? CryptoRenta calcula tus impuestos crypto para la declaración de la renta española sin que tus datos salgan jamás de tu navegador.

[🌐 Demo](https://cryptorenta.app) · [📖 Guía de uso](https://cryptorenta.app/guia) · [🐛 Reportar bug](https://github.com/jpradanos00/crypto-renta/issues)

---

## ✨ Características

- **🇪🇸 Preparado para IRPF España** — Cubo 1 (Ganancias/Pérdidas 1800-1814), Cubo 2 (Staking 0027), Cubo 3 (Airdrops 0304+)
- **🔒 Zero-Knowledge** — Procesamiento 100% local vía Web Workers. Tus CSVs nunca llegan a un servidor.
- **📊 FIFO por activo** — Método First-In-First-Out según normativa AEAT
- **🧮 Precisión decimal** — Cálculos con `decimal.js-light` (40 decimales), sin errores de redondeo de JavaScript
- **🔄 Multi-exchange** — Arquitectura preparada para múltiples exchanges. Transferencias cross-exchange con correlación automática.
- **🗑️ Deduplicación automática** — Múltiples CSVs, IDs de transacción deduplicados
- **📱 Responsive** — Funciona en escritorio y móvil
- **🌍 Bilingüe** — Español e Inglés

---

## 🚀 Cómo usar

### 1. Exporta tu historial de transacciones

Ve a tu exchange y genera el CSV con el historial completo de transacciones:

- **Coinbase** → Configuración → Informes → Historial de transacciones

⚠️ **Importante:** Sube todo tu historial desde el primer día. El algoritmo FIFO necesita todas las compras para calcular correctamente el coste de adquisición de cada venta.

### 2. Arrástralos a la calculadora

Ve a [cryptorenta.app/calculadora](https://cryptorenta.app/calculadora) y arrastra los archivos CSV. Se aceptan múltiples CSVs, se deduplican automáticamente por ID de transacción.

### 3. Revisa los envíos detectados

La app detecta automáticamente los envíos (Send) y los clasifica como **propio** o **tercero**. Verifica que la clasificación sea correcta:

- ✅ **Wallet propia:** no se declara. No hay alteración patrimonial — DGT V0807-22.
- ❌ **Pago a tercero:** debes marcarlo manualmente. En ese caso SÍ hay transmisión y se genera DisposalEvent.

Si subes CSVs de varios exchanges, la app **correlaciona automáticamente** los Sends con los Receives usando la dirección de wallet para preservar el cost basis original.

### 4. Obtén tus resultados fiscales por año

La tabla de desglose por moneda está en el formato exacto de **Monedas Virtuales** de Renta Web — copia, pega y listo.

---

## 🏦 Exchanges Soportados

| Exchange | Estado | Parser |
|----------|--------|--------|
| Coinbase | ✅ Completo | [`src/engine/parser/coinbase.ts`](src/engine/parser/coinbase.ts) |
| Binance | 🔜 Próximamente | ¿Quieres contribuir? [Ver guía](#cómo-añadir-soporte-para-un-nuevo-exchange) |
| Kraken | 🔜 Próximamente | ¿Quieres contribuir? [Ver guía](#cómo-añadir-soporte-para-un-nuevo-exchange) |
| *Tu exchange* | 📝 ¡Añádelo! | Lee cómo abajo |

---

## 📋 Comportamiento Fiscal por Tipo de Transacción

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

## 🔄 Transferencias cross‑exchange (cómo funciona la correlación)

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

## ⚠️ Lo que NO hace (todavía)

- ❌ No calcula la cuota tributaria (tipos progresivos 19–28 %). La app te da los importes; tú aplicas los tipos que correspondan.
- ❌ No aplica la exención de €1,000 para pequeñas ganancias.
- ❌ No genera el borrador de Renta Web — solo el desglose por moneda.

---

## 🧑‍💻 Desarrollo

```bash
npm install
npm run dev      # Servidor de desarrollo Next.js
npm test         # Tests con Vitest
npm run build    # Build de producción (export estático)
```

### Estructura del proyecto

```
src/
├── engine/
│   ├── fifo/engine.ts     # Motor FIFO
│   ├── fiscal/            # Clasificador y reportero fiscal
│   ├── parser/            # Parsers de CSV + sanitizer
│   └── worker/            # Pipeline y Web Worker
├── components/            # UI React
├── lib/                   # decimal.js, helpers fiscales, i18n
└── store/                 # Zustand
```

### Convenciones

- Todos los cálculos monetarios usan `decimal.js‑light` (precisión 40). **Nunca** usar `number` de JavaScript.
- Los tests están en `tests/`. Ejecutar `npm test` antes de cada PR.
- La zona horaria fiscal es `Europe/Madrid`. No modificar sin verificar el impacto en el cambio de año fiscal.
- El código debe estar en **inglés**. La UI en español e inglés.

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Este proyecto es por y para la comunidad.

### Cómo añadir soporte para un nuevo exchange

El proyecto usa una arquitectura modular de parsers. Para añadir tu exchange:

1. **Crea un parser:** Añade un archivo en `src/engine/parser/tu-exchange.ts` que exporte una función `parseTuExchangeCSV(csvText: string): CoinbaseRawRow[]` que mapee las columnas de tu exchange al formato interno.

2. **Rellena las direcciones de wallet:** Si el CSV de tu exchange incluye direcciones (`sender`/`recipient`), rellena `senderAddress` y `recipientAddress` en el raw row — así la correlación cross‑exchange funcionará con el Nivel 1 (determinista). Si no las incluye, documéntalo como limitación y el sistema degradará automáticamente al nivel 2 (heurístico).

3. **Registra el parser:** Añade tu exchange a la tabla de parsers en [`src/engine/worker/bridge-fallback.ts`](src/engine/worker/bridge-fallback.ts).

4. **Añade la guía de exportación:** Crea los pasos de exportación en los archivos de traducción (`src/lib/i18n/es.json` y `en.json`).

5. **Tests:** Añade tests en `tests/engine/` con un fixture CSV sintético de tu exchange.

6. **Pull Request:** Envía un PR con tus cambios.

### Buenas prácticas

- Usa `decimal.js-light` para todos los cálculos monetarios. Nunca uses `number` de JavaScript.
- Los tests van en `tests/` con Vitest. Ejecuta `npm test` antes de cada PR.
- El código debe estar en **inglés**. La UI en español e inglés.
- No añadas telemetría ni llamadas a servidor. El proyecto es 100% client‑side.

### Issues abiertas para contribuir

¿Quieres ayudar pero no sabes por dónde empezar? Busca issues con la etiqueta [`good first issue`](https://github.com/jpradanos00/crypto-renta/labels/good%20first%20issue).

### Agradecimientos

¡Gracias a todos los contribuidores que hacen este proyecto posible!

---

## ⚠️ Descargo de responsabilidad

Esta herramienta es solo para fines informativos. No constituye asesoramiento fiscal. Consulta con un profesional para tu declaración oficial.

---

## 📄 Licencia

MIT — Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

## 🤖 Vibecoding con IA

CryptoRenta ha sido desarrollado en un **~95% con inteligencia artificial** usando [OpenCode](https://github.com/anomalyco/opencode) — un agente de codificación autónomo de nueva generación.

El workflow de desarrollo ha sido radicalmente distinto al tradicional:

- **1 humano** (dirección, diseño de arquitectura, revisión de PRs)
- **Múltiples agentes y subagentes de IA** trabajando en paralelo como un equipo de ingenieros
- **97 tests pasando**, tipado estricto TypeScript, código inglés, UI bilingüe
- **Cada commit** es revisado por un agente distinto al que lo escribió

> *"Programar ya no es picar teclas. Es orquestar agentes."*

Este proyecto es una prueba viviente de que el futuro del software open source pasa por combinar talento humano con agentes de IA. Si te interesa esta forma de desarrollar, el código está abierto para que veas exactamente cómo se ha hecho.

El rol humano ha sido clave en: definición de la normativa fiscal española, diseño de la arquitectura multi-exchange, decision de algoritmo (TransferLedger, FIFO), y revisión fiscal de cada cambio.

---

Hecho con ❤️ por la comunidad y 🤖 por agentes de IA. [@jpradanos00](https://github.com/jpradanos00)
