import { describe, expect, it } from "vitest";
import reducer, {
  initialState, resetTransactionFilters, setCustomer, setCustomRange, setPeriod, setTransactionFilter,
  setTransactionPage, setTrendMonths, toggleHideAmounts,
} from "./preferencesSlice";

describe("preferences", () => {
  it("choosing a quick period clears a custom range", () => {
    let s = reducer(initialState, setCustomRange({ startDate: "2026-09-01", endDate: "2026-09-30" }));
    expect(s.customRange).toEqual({ startDate: "2026-09-01", endDate: "2026-09-30" });
    s = reducer(s, setPeriod("7d"));
    expect(s).toMatchObject({ period: "7d", customRange: null });
  });
  it("half a custom range is not kept", () => {
    expect(reducer(initialState, setCustomRange({ startDate: "2026-09-01" })).customRange).toBeNull();
  });
  it("changing any filter goes back to the first page", () => {
    let s = reducer(initialState, setTransactionPage(4));
    expect(s.transactions.page).toBe(4);
    s = reducer(s, setTransactionFilter({ category: "Dining" }));
    expect(s.transactions).toMatchObject({ category: "Dining", page: 0 });
  });
  it("clearing filters keeps the chosen page size", () => {
    let s = reducer(initialState, setTransactionFilter({ pageSize: 50, category: "Dining", sortBy: "amount_desc" }));
    s = reducer(s, resetTransactionFilters());
    expect(s.transactions).toEqual({ ...initialState.transactions, pageSize: 50 });
  });
  it("trend months stay between 1 and 24", () => {
    expect(reducer(initialState, setTrendMonths(99)).trendMonths).toBe(24);
    expect(reducer(initialState, setTrendMonths("6")).trendMonths).toBe(6);
  });
  it("A NEW CUSTOMER STARTS CLEAN: one customer's filters never carry over to another", () => {
    let s = reducer(initialState, setTransactionFilter({ category: "Dining" }));
    s = reducer(s, setPeriod("1y"));
    s = reducer(s, toggleHideAmounts());
    s = reducer(s, setCustomer("67890"));
    expect(s).toEqual({ ...initialState, customerId: "67890", hideAmounts: true });
  });
});
