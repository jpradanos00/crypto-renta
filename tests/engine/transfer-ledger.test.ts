import { describe, it, expect } from "vitest";
import { TransferLedger } from "@/engine/transfer/ledger";
import { d, ZERO } from "@/lib/decimal";

function makeQuery(overrides: Partial<{
  asset: string;
  quantity: string;
  timestamp: Date;
  senderAddress: string | null;
}> = {}) {
  return {
    asset: overrides.asset ?? "ETH",
    quantity: d(overrides.quantity ?? "1"),
    timestamp: overrides.timestamp ?? new Date("2024-06-15T12:00:00Z"),
    senderAddress: overrides.senderAddress ?? null,
  };
}

describe("TransferLedger", () => {
  it("guarda un transfer pendiente sin hacer match", () => {
    const ledger = new TransferLedger();
    ledger.save("ETH", d("1"), new Date("2024-06-15T10:00:00Z"), "coinbase", "0x123", [
      { costPerUnit: d("2000"), quantityUsed: d("1"), acquiredAt: new Date("2024-01-01") },
    ]);

    expect(ledger.getPending()).toHaveLength(1);
  });

  describe("Nivel 1 — Match por dirección (determinista)", () => {
    it("empareja cuando recipientAddress del Send == senderAddress del Receive", () => {
      const ledger = new TransferLedger();
      ledger.save(
        "ETH", d("1"),
        new Date("2024-06-15T10:00:00Z"),
        "kraken", "0xABC",
        [{ costPerUnit: d("2000"), quantityUsed: d("1"), acquiredAt: new Date("2024-01-01") }]
      );

      const match = ledger.findMatch(makeQuery({
        senderAddress: "0xABC",
        quantity: "1",
        timestamp: new Date("2024-06-15T12:00:00Z"),
      }));

      expect(match).not.toBeNull();
      expect(match!.lots[0].costPerUnit.toString()).toBe("2000");
      expect(ledger.getPending()).toHaveLength(0); // consumido
    });

    it("no empareja si el address no coincide (ni cae al nivel 2)", () => {
      const ledger = new TransferLedger();
      ledger.save(
        "ETH", d("1"),
        new Date("2024-06-15T10:00:00Z"),
        "kraken", "0x111",
        [{ costPerUnit: d("2000"), quantityUsed: d("1"), acquiredAt: new Date("2024-01-01") }]
      );

      // Query con address distinto: no debe caer al nivel 2 porque
      // hay un pending con address que no coincide
      const match = ledger.findMatch(makeQuery({ senderAddress: "0x222" }));
      expect(match).toBeNull();
      expect(ledger.getPending()).toHaveLength(1); // no consumido
    });

    it("no empareja si el asset no coincide", () => {
      const ledger = new TransferLedger();
      ledger.save(
        "BTC", d("1"),
        new Date("2024-06-15T10:00:00Z"),
        "kraken", "0xABC",
        [{ costPerUnit: d("2000"), quantityUsed: d("1"), acquiredAt: new Date("2024-01-01") }]
      );

      const match = ledger.findMatch(makeQuery({ asset: "ETH", senderAddress: "0xABC" }));
      expect(match).toBeNull();
    });
  });

  describe("Nivel 2 — Match heurístico (fallback sin addresses)", () => {
    it("empareja por timestamp + cantidad cuando no hay addresses", () => {
      const ledger = new TransferLedger();
      ledger.save(
        "ETH", d("1"),
        new Date("2024-06-15T10:00:00Z"),
        "kraken", null,
        [{ costPerUnit: d("2000"), quantityUsed: d("1"), acquiredAt: new Date("2024-01-01") }]
      );

      const match = ledger.findMatch(makeQuery({
        senderAddress: null,
        quantity: "1",
        timestamp: new Date("2024-06-15T12:00:00Z"),
      }));

      expect(match).not.toBeNull();
      expect(match!.lots[0].costPerUnit.toString()).toBe("2000");
    });

    it("no empareja si el timestamp está fuera de la ventana de 72h", () => {
      const ledger = new TransferLedger();
      ledger.save(
        "ETH", d("1"),
        new Date("2024-06-15T10:00:00Z"),
        "kraken", null,
        [{ costPerUnit: d("2000"), quantityUsed: d("1"), acquiredAt: new Date("2024-01-01") }]
      );

      const match = ledger.findMatch(makeQuery({
        timestamp: new Date("2024-06-20T10:00:00Z"), // 5 días después
      }));

      expect(match).toBeNull();
      expect(ledger.getPending()).toHaveLength(1); // no consumido
    });

    it("no empareja si la cantidad difiere >0.5%", () => {
      const ledger = new TransferLedger();
      ledger.save(
        "ETH", d("1"),
        new Date("2024-06-15T10:00:00Z"),
        "kraken", null,
        [{ costPerUnit: d("2000"), quantityUsed: d("1"), acquiredAt: new Date("2024-01-01") }]
      );

      const match = ledger.findMatch(makeQuery({ quantity: "0.5" }));
      expect(match).toBeNull();
    });

    it("acepta cantidad ligeramente menor por fee de red (<0.5%)", () => {
      const ledger = new TransferLedger();
      ledger.save(
        "ETH", d("1"),
        new Date("2024-06-15T10:00:00Z"),
        "kraken", null,
        [{ costPerUnit: d("2000"), quantityUsed: d("1"), acquiredAt: new Date("2024-01-01") }]
      );

      const match = ledger.findMatch(makeQuery({ quantity: "0.997" }));
      expect(match).not.toBeNull();
    });

    it("no empareja si el Receive es anterior al Send", () => {
      const ledger = new TransferLedger();
      ledger.save(
        "ETH", d("1"),
        new Date("2024-06-15T12:00:00Z"),
        "kraken", null,
        [{ costPerUnit: d("2000"), quantityUsed: d("1"), acquiredAt: new Date("2024-01-01") }]
      );

      const match = ledger.findMatch(makeQuery({
        timestamp: new Date("2024-06-15T10:00:00Z"), // anterior
      }));

      expect(match).toBeNull();
    });
  });

  it("no guarda transfers con cantidad 0 o negativa", () => {
    const ledger = new TransferLedger();
    ledger.save("ETH", ZERO, new Date(), "coinbase", null, []);
    expect(ledger.getPending()).toHaveLength(0);
  });
});
