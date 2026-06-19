"use client";

import { useAppStore } from "@/store/app-store";

export function YearSelector() {
  const availableYears = useAppStore((s) => s.availableYears);
  const selectedYear = useAppStore((s) => s.selectedYear);
  const setSelectedYear = useAppStore((s) => s.setSelectedYear);
  const reports = useAppStore((s) => s.reports);
  const setReport = useAppStore((s) => s.setReport);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = Number(e.target.value);
    setSelectedYear(year);
    setReport(reports.get(year) ?? null);
  };

  if (availableYears.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="year-select" className="text-sm font-medium">
        Año fiscal
      </label>
      <select
        id="year-select"
        value={selectedYear}
        onChange={handleChange}
        className="rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {availableYears.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}
