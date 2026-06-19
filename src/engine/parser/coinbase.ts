import Papa from "papaparse";
import type { CoinbaseRawRow } from "@/engine/types";

export function parseCoinbaseCSV(csvText: string): CoinbaseRawRow[] {
  const lines = csvText.split("\n");
  const dataLines = lines.slice(3).join("\n");

  const parseResult = Papa.parse<CoinbaseRawRow>(dataLines, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => {
      if (header === "Spot Price Currency") return "Price Currency";
      if (header === "Spot Price at Transaction") return "Price at Transaction";
      return header;
    },
  });

  return parseResult.data;
}
