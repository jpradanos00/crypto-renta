import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "../test-utils";
import { ProgressIndicator } from "@/components/progress-indicator";
import { useAppStore } from "@/store/app-store";

describe("ProgressIndicator", () => {
  beforeEach(() => {
    useAppStore.setState({
      csvFiles: [], rawTransactions: [], status: "idle", progress: { phase: "", percent: 0 },
      selectedYear: new Date().getFullYear() - 1, report: null, reports: new Map(),
      availableYears: [], fullHistory: null, errors: [],
      sendDecisions: new Map(), pendingTransactions: [],
    });
  });

  it("is hidden when status is not calculating", () => {
    useAppStore.setState({ status: "idle" });
    const { container } = render(<ProgressIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it("renders progress bar with correct aria attributes when calculating", () => {
    useAppStore.setState({
      status: "calculating",
      progress: { phase: "Parseando CSVs...", percent: 42 },
    });
    render(<ProgressIndicator />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "42");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(screen.getByText("Parseando CSVs...")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
  });
});
