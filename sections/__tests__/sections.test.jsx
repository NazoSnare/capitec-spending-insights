/**
 * Sections against the real API logic (see test/render.jsx): what a customer sees for
 * a given period, filter or failure.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockApi, NOW, renderWithProviders, shown } from "@/test/render";
import * as spending from "@/server/spending";
import SummaryCards from "@/sections/SummaryCards";
import CategoryBreakdown from "@/sections/CategoryBreakdown";
import GoalsSection from "@/sections/GoalsSection";
import TransactionList from "@/sections/TransactionList";
import TransactionFilters from "@/sections/TransactionFilters";
import PeriodToolbar, { rangeProblem } from "@/sections/PeriodToolbar";
import { formatZAR } from "@/lib/format";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

beforeEach(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(NOW); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("SummaryCards", () => {
  it("shows the period's figures from the API", async () => {
    mockApi();
    renderWithProviders(<SummaryCards />);
    const expected = spending.getSummary("12345", { period: "30d" }, NOW);
    expect(await screen.findByText(shown(formatZAR(expected.totalSpent)))).toBeInTheDocument();
    expect(screen.getByText(String(expected.transactionCount))).toBeInTheDocument();
    expect(screen.getByText(expected.topCategory)).toBeInTheDocument();
  });
  it("asks for the persisted period", async () => {
    const fetch = mockApi();
    renderWithProviders(<SummaryCards />, { preferences: { period: "90d" } });
    await screen.findByText("Total spent");
    expect(fetch.mock.calls.some(([u]) => String(u).includes("summary?period=90d"))).toBe(true);
  });
  it("says what went wrong and retries when asked", async () => {
    const fetch = mockApi({ fail: { match: /summary/, status: 503, message: "Spending figures are unavailable right now." } });
    renderWithProviders(<SummaryCards />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Spending figures are unavailable right now.");
    const before = fetch.mock.calls.length;
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    await waitFor(() => expect(fetch.mock.calls.length).toBeGreaterThan(before));
  });
});

describe("CategoryBreakdown", () => {
  it("lists every category, largest first, with shares that add up to 100", async () => {
    mockApi();
    renderWithProviders(<CategoryBreakdown />);
    const list = await screen.findByRole("list", { name: "Spending by category" });
    const expected = spending.getCategories("12345", { period: "30d" }, NOW).categories;
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(expected.length);
    expect(items[0]).toHaveTextContent(expected[0].name);
    expect(expected.reduce((a, c) => a + c.percentage, 0)).toBeCloseTo(100, 10);
  });
  it("uses a custom range when one is set", async () => {
    const fetch = mockApi();
    renderWithProviders(<CategoryBreakdown />, { preferences: { customRange: { startDate: "2026-08-01", endDate: "2026-08-31" } } });
    await screen.findByRole("list", { name: "Spending by category" });
    expect(fetch.mock.calls.some(([u]) => String(u).includes("startDate=2026-08-01") && String(u).includes("endDate=2026-08-31"))).toBe(true);
    expect(screen.getByText("1 Aug 2026 – 31 Aug 2026")).toBeInTheDocument();
  });
});

describe("GoalsSection", () => {
  it("shows each budget with its status in words", async () => {
    mockApi();
    renderWithProviders(<GoalsSection />);
    const { goals } = spending.getGoals("12345", NOW);
    for (const g of goals) expect(await screen.findByRole("progressbar", { name: new RegExp(`^${g.category}:`) })).toBeInTheDocument();
    expect(screen.getByText("20 days left this month")).toBeInTheDocument();
  });
});

describe("Transactions", () => {
  it("filtering by category sends it, and only that category is listed", async () => {
    const fetch = mockApi();
    renderWithProviders(<><TransactionFilters /><TransactionList /></>);
    await screen.findByText(/found$/);
    await userEvent.selectOptions(await screen.findByLabelText("Category"), "Dining");
    await waitFor(() => expect(fetch.mock.calls.some(([u]) => String(u).includes("category=Dining"))).toBe(true));
    const total = spending.getTransactions("12345", { category: "Dining" }, NOW).pagination.total;
    expect(await screen.findByText(`${total.toLocaleString("en-ZA")} found`)).toBeInTheDocument();
  });
  it("a backwards date range is caught on screen and never sent", async () => {
    const fetch = mockApi();
    renderWithProviders(<><TransactionFilters /><TransactionList /></>, { preferences: { transactions: { category: "", sortBy: "date_desc", pageSize: 20, page: 0, startDate: "2026-09-20", endDate: "2026-09-01" } } });
    expect(await screen.findByRole("alert")).toHaveTextContent(/on or before/);
    expect(fetch.mock.calls.some(([u]) => String(u).includes("startDate=2026-09-20"))).toBe(false);
  });
  it("pages forward", async () => {
    const fetch = mockApi();
    renderWithProviders(<TransactionList />);
    await screen.findByText(/^1–20 of/);
    await userEvent.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() => expect(fetch.mock.calls.some(([u]) => String(u).includes("offset=20"))).toBe(true));
    expect(await screen.findByText(/^21–40 of/)).toBeInTheDocument();
  });
});

describe("PeriodToolbar", () => {
  it("checks a custom range before it is applied", async () => {
    expect(rangeProblem("", "2026-09-01", "2026-10-11")).toMatch(/both/);
    expect(rangeProblem("2026-09-10", "2026-09-01", "2026-10-11")).toMatch(/on or before/);
    expect(rangeProblem("2026-11-01", "2026-11-05", "2026-10-11")).toMatch(/future/);
    expect(rangeProblem("2026-09-01", "2026-09-30", "2026-10-11")).toBeNull();

    mockApi();
    const { store } = renderWithProviders(<PeriodToolbar />);
    await userEvent.click(screen.getByRole("radio", { name: "90 days" }));
    expect(store.getState().preferences.period).toBe("90d");
    await userEvent.click(screen.getByRole("button", { name: /custom range/i }));
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/both/);
    expect(store.getState().preferences.customRange).toBeNull();
  });
});
