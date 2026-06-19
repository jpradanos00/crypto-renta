import { CalculadoraClient } from "@/components/calculadora-client";

export default function CalculadoraPage() {
  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calculadora</h1>
          <p className="mt-2 text-muted-foreground">
            Sube tus CSVs de Coinbase para calcular tu IRPF.
          </p>
        </div>
        <CalculadoraClient />
      </div>
    </main>
  );
}
