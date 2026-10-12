import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { makeStore } from "@/utils/store";
import SpendingTrendChart from "../SpendingTrendChart";

// 24 months: every month name appears twice ("Nov" 2024 and "Nov" 2025). Bars used to be
// placed at their label, so the two Novembers became one slot and the axis showed 12.
const trends = Array.from({ length: 24 }, (_, i) => {
  const d = new Date(Date.UTC(2024, 10 + i, 1));
  return { month: d.toISOString().slice(0, 7), totalSpent: 1000 + i * 10, transactionCount: 5, partial: i === 23 };
});

const MONTHS = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/;

describe("SpendingTrendChart", () => {
  it("gives each of 24 months its own place on the axis, even when two share a name", () => {
    const { container } = render(<Provider store={makeStore({ persist: false }).store}><SpendingTrendChart trends={trends} /></Provider>);
    const labels = [...container.querySelectorAll("text")].map((t) => t.textContent).filter((t) => MONTHS.test(t));
    expect(labels).toHaveLength(24);
    expect(labels.slice(0, 2)).toEqual(["Nov", "Dec"]);
    expect(labels.slice(12, 14)).toEqual(["Nov", "Dec"]);
  });
});
