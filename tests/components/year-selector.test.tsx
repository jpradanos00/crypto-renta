import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { YearSelector } from "@/components/year-selector";
import { useAppStore } from "@/store/app-store";

describe("YearSelector", () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState ? useAppStore.getInitialState() : {
      csvFiles: [], rawTransactions: [], status: "idle", progress: { phase: "", percent: 0 },
      selectedYear: new Date().getFullYear() - 1, report: null, reports: new Map(),
      availableYears: [], fullHistory: null, errors: [],
    });
  });

  it("is hidden when no available years", () => {
    useAppStore.setState({ availableYears: [] });
    const { container } = render(<YearSelector />);
    expect(container.firstChild).toBeNull();
  });

  it("renders select with available years", () => {
    useAppStore.setState({
      availableYears: [2022, 2023, 2024],
      selectedYear: 2024,
      reports: new Map(),
    });
    render(<YearSelector />);
    const select = screen.getByRole("combobox", { name: /Año fiscal/i });
    expect(select).toBeInTheDocument();
    expect(screen.getByText("2022")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
  });

  it("updates selected year on change", () => {
    useAppStore.setState({
      availableYears: [2022, 2023, 2024],
      selectedYear: 2024,
      reports: new Map(),
    });
    render(<YearSelector />);
    const select = screen.getByRole("combobox", { name: /Año fiscal/i });
    fireEvent.change(select, { target: { value: "2022" } });
    expect(useAppStore.getState().selectedYear).toBe(2022);
  });
});
