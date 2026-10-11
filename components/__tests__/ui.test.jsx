import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, shown } from "@/test/render";
import Delta from "@/components/ui/Delta";
import Money from "@/components/ui/Money";
import SegmentedControl from "@/components/ui/SegmentedControl";
import ProgressBar from "@/components/ui/ProgressBar";
import Pagination from "@/components/ui/Pagination";
import { QueryState } from "@/components/ui/States";

describe("Delta", () => {
  it("spending up is shown as bad, and the direction is said in words too", () => {
    renderWithProviders(<Delta value={12.5} goodWhen="down" label="vs last month" />);
    expect(screen.getByText("+12.5%")).toBeInTheDocument();
    expect(screen.getByText("up")).toHaveClass("sr-only");
    expect(screen.getByText("+12.5%").parentElement.className).toContain("text-bad");
  });
  it("says so when there is nothing to compare", () => {
    renderWithProviders(<Delta value={null} />);
    expect(screen.getByText(/no earlier data/i)).toBeInTheDocument();
  });
});

describe("Money", () => {
  it("formats rands, and hides them from sight and from screen readers when asked", () => {
    const { unmount } = renderWithProviders(<Money amount={4275.1} />);
    expect(screen.getByText(shown("R4\u00a0275.10"))).toBeInTheDocument();
    unmount();
    renderWithProviders(<Money amount={4275.1} />, { preferences: { hideAmounts: true } });
    expect(screen.queryByText(/4\s275/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Amount hidden")).toBeInTheDocument();
  });
});

describe("SegmentedControl", () => {
  it("is a radio group: one tab stop, arrow keys move the choice", async () => {
    const onChange = vi.fn();
    renderWithProviders(<SegmentedControl label="Period" value="30d" onChange={onChange}
      options={[{ value: "7d", label: "7 days" }, { value: "30d", label: "30 days" }, { value: "90d", label: "90 days" }]} />);
    const checked = screen.getByRole("radio", { name: "30 days" });
    expect(checked).toHaveAttribute("aria-checked", "true");
    expect(screen.getAllByRole("radio").filter((r) => r.tabIndex === 0)).toHaveLength(1);
    checked.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("90d");
    await userEvent.click(screen.getByRole("radio", { name: "7 days" }));
    expect(onChange).toHaveBeenCalledWith("7d");
  });
});

describe("ProgressBar and Pagination", () => {
  it("a progress bar reports its value and caps the bar at full", () => {
    renderWithProviders(<ProgressBar value={130} label="Groceries budget" />);
    expect(screen.getByRole("progressbar", { name: "Groceries budget" })).toHaveAttribute("aria-valuenow", "100");
  });
  it("pagination shows the range and stops at the ends", async () => {
    const onPage = vi.fn();
    renderWithProviders(<Pagination offset={0} limit={20} total={45} onPage={onPage} />);
    expect(screen.getByText("1–20 of 45")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPage).toHaveBeenCalledWith(1);
  });
});

describe("QueryState", () => {
  it("shows loading, error with retry, empty, or the data", async () => {
    const refetch = vi.fn();
    const { rerender } = renderWithProviders(<QueryState result={{ isLoading: true }}>{() => "data"}</QueryState>);
    expect(screen.getByRole("status")).toBeInTheDocument();
    rerender(<QueryState result={{ isError: true, refetch }} errorText="Down">{() => "data"}</QueryState>);
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(refetch).toHaveBeenCalled();
    rerender(<QueryState result={{ data: [] }} isEmpty={(d) => !d.length}>{() => "data"}</QueryState>);
    expect(screen.getByText(/nothing here yet/i)).toBeInTheDocument();
    rerender(<QueryState result={{ data: [1] }}>{() => "data"}</QueryState>);
    expect(screen.getByText("data")).toBeInTheDocument();
  });
});
