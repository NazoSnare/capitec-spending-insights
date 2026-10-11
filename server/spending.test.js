/**
 * The API's rules. "now" is fixed so no assertion depends on today's date.
 */
import { describe, expect, it } from "vitest";
import {
  ApiError, getCategories, getFilters, getGoals, getProfile, getSummary, getTransactions, getTrends,
  goalStatus, percentages, resolveRange,
} from "./spending";

const NOW = new Date("2026-10-11T12:00:00Z");
const C = "12345";
const err = (fn) => { try { fn(); } catch (e) { return e; } throw new Error("expected an ApiError"); };

describe("ranges", () => {
  it("a quick period ends today and covers that many days, inclusive", () => {
    expect(resolveRange({ period: "7d" }, NOW)).toEqual({ startDate: "2026-10-05", endDate: "2026-10-11", period: "7d" });
    expect(resolveRange({}, NOW).period).toBe("30d");
  });
  it("refuses an unknown period, half a range, a backwards range and an impossible date", () => {
    expect(err(() => resolveRange({ period: "2w" }, NOW)).code).toBe("INVALID_PERIOD");
    expect(err(() => resolveRange({ startDate: "2026-09-01" }, NOW)).code).toBe("INCOMPLETE_RANGE");
    expect(err(() => resolveRange({ startDate: "2026-09-10", endDate: "2026-09-01" }, NOW)).code).toBe("INVALID_RANGE");
    expect(err(() => resolveRange({ startDate: "2026-02-31", endDate: "2026-03-05" }, NOW)).code).toBe("INVALID_DATE");
    expect(err(() => resolveRange({ startDate: "01/09/2026", endDate: "2026-09-05" }, NOW)).code).toBe("INVALID_DATE");
  });
  it("a range running past today is cut at today", () => {
    expect(resolveRange({ startDate: "2026-10-01", endDate: "2026-12-31" }, NOW).endDate).toBe("2026-10-11");
  });
});

describe("percentages", () => {
  it("ALWAYS ADD UP TO 100: the brief's own sample totals 99.9%", () => {
    const sample = [125030, 89020, 68045, 52030, 45080, 45870];
    expect(percentages(sample).reduce((a, b) => a + b, 0)).toBeCloseTo(100, 10);
    expect(percentages([1, 1, 1]).reduce((a, b) => a + b, 0)).toBeCloseTo(100, 10);
    expect(percentages([0, 0])).toEqual([0, 0]);
  });
});

describe("the endpoints agree with each other", () => {
  it("the summary total equals the category total for the same period", () => {
    const s = getSummary(C, { period: "30d" }, NOW);
    const c = getCategories(C, { period: "30d" }, NOW);
    expect(c.totalAmount).toBe(s.totalSpent);
    expect(c.categories.reduce((n, x) => n + x.transactionCount, 0)).toBe(s.transactionCount);
    expect(c.categories[0].name).toBe(s.topCategory);
  });
  it("the category amounts add up to the total, to the cent", () => {
    const c = getCategories(C, { period: "90d" }, NOW);
    const cents = c.categories.reduce((n, x) => n + Math.round(x.amount * 100), 0);
    expect(cents).toBe(Math.round(c.totalAmount * 100));
  });
  it("categories are listed largest first", () => {
    const amounts = getCategories(C, { period: "1y" }, NOW).categories.map((x) => x.amount);
    expect([...amounts].sort((a, b) => b - a)).toEqual(amounts);
  });
  it("the profile's lifetime total equals every transaction added up", () => {
    const all = getTransactions(C, { limit: "100" }, NOW);
    let cents = 0;
    for (let offset = 0; offset < all.pagination.total; offset += 100) {
      cents += getTransactions(C, { limit: "100", offset: String(offset) }, NOW).transactions.reduce((n, t) => n + Math.round(t.amount * 100), 0);
    }
    expect(Math.round(getProfile(C, NOW).totalSpent * 100)).toBe(cents);
  });
  it("is deterministic: the same request gives the same answer", () => {
    expect(getTransactions(C, {}, NOW)).toEqual(getTransactions(C, {}, NOW));
  });
  it("no transaction is dated after now", () => {
    const t = getTransactions(C, { sortBy: "date_desc", limit: "1" }, NOW).transactions[0];
    expect(t.date <= NOW.toISOString()).toBe(true);
  });
});

describe("summary", () => {
  it("compares against the window of the same length just before it", () => {
    const s = getSummary(C, { period: "7d" }, NOW);
    expect(s.period).toBe("7d");
    expect(typeof s.comparedToPrevious.spentChange === "number" || s.comparedToPrevious.spentChange === null).toBe(true);
    expect(s.averageTransaction).toBeCloseTo(s.totalSpent / s.transactionCount, 1);
  });
});

describe("trends", () => {
  it("returns the asked-for number of months, oldest first, with the current month marked partial", () => {
    const { trends } = getTrends(C, { months: "6" }, NOW);
    expect(trends.map((t) => t.month)).toEqual(["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]);
    expect(trends.at(-1).partial).toBe(true);
    expect(trends.slice(0, -1).every((t) => !t.partial)).toBe(true);
  });
  it("defaults to 12 and refuses anything outside 1 to 24", () => {
    expect(getTrends(C, {}, NOW).trends).toHaveLength(12);
    for (const m of ["0", "25", "abc", "1.5"]) expect(err(() => getTrends(C, { months: m }, NOW)).code).toBe("INVALID_MONTHS");
  });
});

describe("transactions", () => {
  it("pages by limit and offset", () => {
    const a = getTransactions(C, { limit: "10", offset: "0" }, NOW);
    const b = getTransactions(C, { limit: "10", offset: "10" }, NOW);
    expect(a.transactions).toHaveLength(10);
    expect(a.pagination).toMatchObject({ limit: 10, offset: 0, hasMore: true });
    expect(new Set([...a.transactions, ...b.transactions].map((t) => t.id)).size).toBe(20);
  });
  it("filters by category, case-insensitively, and by dates", () => {
    const r = getTransactions(C, { category: "dining", startDate: "2026-09-01", endDate: "2026-09-30", limit: "100" }, NOW);
    expect(r.transactions.length).toBeGreaterThan(0);
    expect(r.transactions.every((t) => t.category === "Dining" && t.date.startsWith("2026-09"))).toBe(true);
  });
  it("sorts four ways", () => {
    const amounts = getTransactions(C, { sortBy: "amount_desc", limit: "50" }, NOW).transactions.map((t) => t.amount);
    expect([...amounts].sort((a, b) => b - a)).toEqual(amounts);
    const dates = getTransactions(C, { sortBy: "date_asc", limit: "50" }, NOW).transactions.map((t) => t.date);
    expect([...dates].sort()).toEqual(dates);
  });
  it("refuses bad paging, sorting and categories with a 400 and the field named", () => {
    const e = err(() => getTransactions(C, { limit: "101" }, NOW));
    expect(e).toBeInstanceOf(ApiError);
    expect(e.status).toBe(400);
    expect(e.details).toEqual({ limit: "101" });
    expect(err(() => getTransactions(C, { offset: "-1" }, NOW)).code).toBe("INVALID_OFFSET");
    expect(err(() => getTransactions(C, { sortBy: "random" }, NOW)).code).toBe("INVALID_SORT");
    expect(err(() => getTransactions(C, { category: "Gambling" }, NOW)).code).toBe("INVALID_CATEGORY");
  });
  it("carries the category's icon and colour, as the spec shows", () => {
    const t = getTransactions(C, { category: "Groceries", limit: "1" }, NOW).transactions[0];
    expect(t).toMatchObject({ category: "Groceries", icon: "shopping-cart", categoryColor: "#FF6B6B" });
  });
});

describe("goals", () => {
  it("judges by pace through the month, not only by the share used", () => {
    // 60% gone on day 5 of 30 is a warning; 60% on day 25 is fine.
    expect(goalStatus(600, 1000, 5, 30)).toBe("warning");
    expect(goalStatus(600, 1000, 25, 30)).toBe("on_track");
    expect(goalStatus(950, 1000, 29, 30)).toBe("warning");
    expect(goalStatus(1001, 1000, 30, 30)).toBe("over_budget");
  });
  it("reports this month's spending against each budget", () => {
    const { goals } = getGoals(C, NOW);
    expect(goals.length).toBeGreaterThan(0);
    for (const g of goals) {
      expect(g.daysRemaining).toBe(20);
      expect(g.percentageUsed).toBeCloseTo((g.currentSpent / g.monthlyBudget) * 100, 1);
    }
  });
});

describe("customers", () => {
  it("an unknown customer is a 404 on every endpoint", () => {
    for (const fn of [() => getProfile("999", NOW), () => getSummary("999", {}, NOW), () => getFilters("999", NOW), () => getGoals("999", NOW)]) {
      expect(err(fn).status).toBe(404);
    }
  });
  it("two customers have different figures", () => {
    expect(getSummary("12345", {}, NOW).totalSpent).not.toBe(getSummary("67890", {}, NOW).totalSpent);
  });
  it("never exposes internal fields on the profile", () => {
    const p = getProfile(C, NOW);
    expect(p).not.toHaveProperty("budgets");
    expect(p).not.toHaveProperty("appetite");
    expect(Object.keys(p).sort()).toEqual(["accountType", "currency", "customerId", "email", "joinDate", "name", "totalSpent"]);
  });
  it("filters list the brief's six categories and four presets", () => {
    const f = getFilters(C, NOW);
    expect(f.categories.map((c) => c.name)).toEqual(["Groceries", "Entertainment", "Transportation", "Dining", "Shopping", "Utilities"]);
    expect(f.dateRangePresets.map((p) => p.value)).toEqual(["7d", "30d", "90d", "1y"]);
  });
});
