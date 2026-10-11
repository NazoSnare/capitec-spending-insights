/**
 * The seven endpoints of the brief, as pure functions.
 *
 * Each takes the customer id, the query and `now`, and returns the response body. No
 * HTTP here: the route handlers in app/api only parse the request, call one of these
 * and turn an ApiError into a status code. That keeps every rule testable without a
 * server, and keeps "now" injectable so tests never depend on today's date.
 *
 * Amounts are integer cents internally and converted to rands (two decimals) only in
 * the response, at the edge, because the brief's examples are in rands.
 */
import { CATEGORIES, CATEGORY_BY_NAME, CUSTOMERS, DATE_RANGE_PRESETS } from "./catalogue.js";
import { ledger } from "./ledger.js";

export class ApiError extends Error {
  /** @param {number} status @param {string} code @param {string} message @param {object} [details] */
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const PERIOD_DAYS = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
const SORTS = ["date_desc", "date_asc", "amount_desc", "amount_asc"];
const DAY = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const rands = (cents) => Math.round(cents) / 100;
const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;
const dayOf = (d) => d.toISOString().slice(0, 10);
const startOfDay = (iso) => new Date(`${iso}T00:00:00.000Z`);
const endOfDay = (iso) => new Date(`${iso}T23:59:59.999Z`);

function customerLedger(customerId, now) {
  const rows = ledger(String(customerId), now);
  if (!rows) throw new ApiError(404, "CUSTOMER_NOT_FOUND", `No customer with id ${customerId}`);
  return rows;
}

function parseDate(value, field) {
  if (!ISO_DATE.test(value)) throw new ApiError(400, "INVALID_DATE", `${field} must be a date in YYYY-MM-DD format`, { field, value });
  const d = startOfDay(value);
  // 2026-02-31 parses to 3 March; it is not a date the customer meant.
  if (Number.isNaN(d.getTime()) || dayOf(d) !== value) throw new ApiError(400, "INVALID_DATE", `${value} is not a real date`, { field, value });
  return value;
}

/**
 * The window a request covers, inclusive, as ISO dates.
 *
 * A custom range wins over a period when both dates are given, as the brief describes
 * startDate/endDate as the custom option and period as the quick one. Half a custom
 * range is refused rather than guessed.
 */
export function resolveRange({ period, startDate, endDate } = {}, now) {
  if (startDate || endDate) {
    if (!startDate || !endDate) throw new ApiError(400, "INCOMPLETE_RANGE", "Give both startDate and endDate, or neither");
    const s = parseDate(startDate, "startDate");
    const e = parseDate(endDate, "endDate");
    if (s > e) throw new ApiError(400, "INVALID_RANGE", "startDate must be on or before endDate", { startDate, endDate });
    if (s > dayOf(now)) throw new ApiError(400, "INVALID_RANGE", "startDate cannot be in the future", { startDate });
    return { startDate: s, endDate: e > dayOf(now) ? dayOf(now) : e };
  }
  const p = period || "30d";
  if (!(p in PERIOD_DAYS)) throw new ApiError(400, "INVALID_PERIOD", `period must be one of ${Object.keys(PERIOD_DAYS).join(", ")}`, { period: p });
  const end = dayOf(now);
  const start = dayOf(new Date(startOfDay(end).getTime() - (PERIOD_DAYS[p] - 1) * DAY));
  return { startDate: start, endDate: end, period: p };
}

const within = (rows, { startDate, endDate }) => {
  const s = startOfDay(startDate).toISOString();
  const e = endOfDay(endDate).toISOString();
  return rows.filter((t) => t.date >= s && t.date <= e);
};

/** The same-length window immediately before `range`. */
function previousRange({ startDate, endDate }) {
  const len = (startOfDay(endDate) - startOfDay(startDate)) / DAY + 1;
  const end = new Date(startOfDay(startDate).getTime() - DAY);
  const start = new Date(end.getTime() - (len - 1) * DAY);
  return { startDate: dayOf(start), endDate: dayOf(end) };
}

/** Percentage change, one decimal; null when there is nothing to compare against. */
const change = (now, before) => (before ? round1(((now - before) / before) * 100) : null);

/**
 * Shares that add up to exactly 100.0 (largest remainder method). Rounding each share
 * on its own does not: the brief's own example totals 99.9%, and a pie chart labelled
 * with numbers that do not add up invites a support call.
 */
export function percentages(amounts) {
  const total = amounts.reduce((a, b) => a + b, 0);
  if (!total) return amounts.map(() => 0);
  const raw = amounts.map((a) => (a / total) * 1000);
  const floors = raw.map(Math.floor);
  let left = 1000 - floors.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => [v - floors[i], i]).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (left <= 0) break;
    floors[i] += 1;
    left -= 1;
  }
  return floors.map((f) => f / 10);
}

/* ---- 1. Profile ------------------------------------------------------------------ */

export function getProfile(customerId, now = new Date()) {
  const rows = customerLedger(customerId, now);
  const { budgets: _b, appetite: _a, ...c } = CUSTOMERS[customerId];
  return { ...c, totalSpent: rands(rows.reduce((s, t) => s + t.amount, 0)) };
}

/* ---- 2. Summary ------------------------------------------------------------------ */

export function getSummary(customerId, query = {}, now = new Date()) {
  const rows = customerLedger(customerId, now);
  const range = resolveRange({ period: query.period }, now);
  const cur = within(rows, range);
  const prev = within(rows, previousRange(range));
  const spent = cur.reduce((s, t) => s + t.amount, 0);
  const prevSpent = prev.reduce((s, t) => s + t.amount, 0);

  const byCat = new Map();
  for (const t of cur) byCat.set(t.category, (byCat.get(t.category) || 0) + t.amount);
  const top = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    period: range.period,
    totalSpent: rands(spent),
    transactionCount: cur.length,
    averageTransaction: cur.length ? round2(spent / cur.length / 100) : 0,
    topCategory: top ? top[0] : null,
    comparedToPrevious: {
      spentChange: change(spent, prevSpent),
      transactionChange: change(cur.length, prev.length),
    },
  };
}

/* ---- 3. Categories --------------------------------------------------------------- */

export function getCategories(customerId, query = {}, now = new Date()) {
  const rows = customerLedger(customerId, now);
  const range = resolveRange(query, now);
  const cur = within(rows, range);

  const sums = new Map();
  for (const t of cur) {
    const s = sums.get(t.category) || { amount: 0, count: 0 };
    s.amount += t.amount;
    s.count += 1;
    sums.set(t.category, s);
  }
  // Largest first, so the list, the legend and the chart all read in the same order.
  const present = CATEGORIES.filter((c) => sums.has(c.name)).sort((a, b) => sums.get(b.name).amount - sums.get(a.name).amount);
  const shares = percentages(present.map((c) => sums.get(c.name).amount));
  const total = cur.reduce((s, t) => s + t.amount, 0);

  return {
    dateRange: { startDate: range.startDate, endDate: range.endDate },
    totalAmount: rands(total),
    categories: present.map((c, i) => ({
      name: c.name,
      amount: rands(sums.get(c.name).amount),
      percentage: shares[i],
      transactionCount: sums.get(c.name).count,
      color: c.color,
      icon: c.icon,
    })),
  };
}

/* ---- 4. Trends ------------------------------------------------------------------- */

export function getTrends(customerId, query = {}, now = new Date()) {
  const rows = customerLedger(customerId, now);
  const raw = query.months ?? "12";
  const months = Number(raw);
  if (!Number.isInteger(months) || months < 1 || months > 24) {
    throw new ApiError(400, "INVALID_MONTHS", "months must be a whole number from 1 to 24", { months: raw });
  }
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const trends = [];
  for (let back = months - 1; back >= 0; back -= 1) {
    const d = new Date(Date.UTC(y, m - back, 1));
    const key = d.toISOString().slice(0, 7);
    const inMonth = rows.filter((t) => t.date.startsWith(key));
    const spent = inMonth.reduce((s, t) => s + t.amount, 0);
    trends.push({
      month: key,
      totalSpent: rands(spent),
      transactionCount: inMonth.length,
      averageTransaction: inMonth.length ? round2(spent / inMonth.length / 100) : 0,
      // Added to the brief's shape: the current month is not over, and a chart that
      // shows it as a normal month makes spending look as if it dropped.
      partial: back === 0,
    });
  }
  return { trends };
}

/* ---- 5. Transactions ------------------------------------------------------------- */

export function getTransactions(customerId, query = {}, now = new Date()) {
  let rows = customerLedger(customerId, now);

  const limit = query.limit === undefined || query.limit === "" ? 20 : Number(query.limit);
  const offset = query.offset === undefined || query.offset === "" ? 0 : Number(query.offset);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new ApiError(400, "INVALID_LIMIT", "limit must be a whole number from 1 to 100", { limit: query.limit });
  if (!Number.isInteger(offset) || offset < 0) throw new ApiError(400, "INVALID_OFFSET", "offset must be a whole number of 0 or more", { offset: query.offset });

  const sortBy = query.sortBy || "date_desc";
  if (!SORTS.includes(sortBy)) throw new ApiError(400, "INVALID_SORT", `sortBy must be one of ${SORTS.join(", ")}`, { sortBy });

  let category = null;
  if (query.category) {
    category = CATEGORY_BY_NAME.get(String(query.category).toLowerCase());
    if (!category) throw new ApiError(400, "INVALID_CATEGORY", `Unknown category ${query.category}`, { category: query.category });
    rows = rows.filter((t) => t.category === category.name);
  }
  if (query.startDate || query.endDate) rows = within(rows, resolveRange({ startDate: query.startDate, endDate: query.endDate }, now));

  const sorted = [...rows].sort((a, b) => {
    switch (sortBy) {
      case "date_asc": return a.date.localeCompare(b.date);
      case "amount_desc": return b.amount - a.amount || b.date.localeCompare(a.date);
      case "amount_asc": return a.amount - b.amount || b.date.localeCompare(a.date);
      default: return b.date.localeCompare(a.date);
    }
  });
  const page = sorted.slice(offset, offset + limit);

  return {
    transactions: page.map((t) => {
      const c = CATEGORY_BY_NAME.get(t.category.toLowerCase());
      return { ...t, amount: rands(t.amount), icon: c.icon, categoryColor: c.color };
    }),
    pagination: { total: sorted.length, limit, offset, hasMore: offset + limit < sorted.length },
  };
}

/* ---- 6. Goals -------------------------------------------------------------------- */

/**
 * Status by pace, not only by the amount used. Spending 60% of a budget on the 5th of
 * the month is a problem; 60% on the 25th is fine. A single "over 80%" threshold says
 * the opposite of both.
 */
export function goalStatus(spent, budget, dayOfMonth, daysInMonth) {
  if (spent > budget) return "over_budget";
  const pace = budget * (dayOfMonth / daysInMonth);
  if (spent >= budget * 0.9 || spent > pace * 1.1) return "warning";
  return "on_track";
}

export function getGoals(customerId, now = new Date()) {
  const rows = customerLedger(customerId, now);
  const key = now.toISOString().slice(0, 7);
  const days = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const day = now.getUTCDate();
  const thisMonth = rows.filter((t) => t.date.startsWith(key));

  const goals = Object.entries(CUSTOMERS[customerId].budgets).map(([category, budget], i) => {
    const spent = thisMonth.filter((t) => t.category === category).reduce((s, t) => s + t.amount, 0);
    return {
      id: `goal_${String(i + 1).padStart(3, "0")}`,
      category,
      monthlyBudget: rands(budget),
      currentSpent: rands(spent),
      percentageUsed: round2((spent / budget) * 100),
      daysRemaining: days - day,
      status: goalStatus(spent, budget, day, days),
    };
  });
  return { goals };
}

/* ---- 7. Filters ------------------------------------------------------------------ */

export function getFilters(customerId, now = new Date()) {
  customerLedger(customerId, now);
  return { categories: CATEGORIES.map((c) => ({ ...c })), dateRangePresets: DATE_RANGE_PRESETS.map((p) => ({ ...p })) };
}
