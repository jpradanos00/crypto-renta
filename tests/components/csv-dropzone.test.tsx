import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CsvDropzone } from "@/components/csv-dropzone";
import { useAppStore } from "@/store/app-store";

describe("CsvDropzone", () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState ? useAppStore.getInitialState() : {
      csvFiles: [], rawTransactions: [], status: "idle", progress: { phase: "", percent: 0 },
      selectedYear: new Date().getFullYear() - 1, report: null, reports: new Map(),
      availableYears: [], fullHistory: null, errors: [],
    });
  });

  it("renders dropzone message", () => {
    render(<CsvDropzone />);
    expect(screen.getByText(/Arrastra tus CSV aquí/i)).toBeInTheDocument();
  });

  it("has accessible role and tabindex", () => {
    render(<CsvDropzone />);
    const zone = screen.getByRole("button", { name: /Zona de carga/i });
    expect(zone).toHaveAttribute("tabIndex", "0");
  });

  it("opens file picker on Enter key", () => {
    render(<CsvDropzone />);
    const zone = screen.getByRole("button", { name: /Zona de carga/i });
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    fireEvent.keyDown(zone, { key: "Enter" });
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("shows uploaded files and allows removal", () => {
    useAppStore.setState({
      csvFiles: [
        { id: "f1", name: "transactions.csv", size: 1234, content: "foo" },
      ],
    });
    render(<CsvDropzone />);
    expect(screen.getByText("transactions.csv")).toBeInTheDocument();
    const removeBtn = screen.getByRole("button", { name: /Eliminar transactions.csv/i });
    expect(removeBtn).toBeInTheDocument();
  });
});
