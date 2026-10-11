/**
 * The customer's transactions: generated, but deterministic.
 *
 * Every endpoint reads from this one list, so the summary, the category split, the
 * trend and the transaction list always agree with each other, which hard-coded sample
 * responses cannot do. Filters therefore really filter.
 *
 * Each calendar month is generated from its own seed (customer id + month), so:
 *   - the same request gives the same answer on every run and in every test;
 *   - a transaction keeps its id and amount as days pass; only transactions dated after
 *     "now" are hidden, so the statement grows the way a real one does.
 *
 * Amounts are integer cents. Floating-point rand amounts drift (0.1 + 0.2), and on a
 * banking screen a total that is out by a cent is a defect, not a rounding detail.
 */
import { CUSTOMERS, RECURRING, SPEND_PROFILE } from "./catalogue.js";

/** History kept per customer, in months. The trends endpoint allows up to 24. */
export const HISTORY_MONTHS = 25;

/** A small, fast, seedable PRNG (mulberry32). Math.random cannot be seeded. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a: a stable 32-bit hash of a string, used as a seed. */
export function hash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const pick = (r, list) => list[Math.floor(r() * list.length)];
const between = (r, min, max) => Math.round(min + (max - min) * r());
const daysIn = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const pad = (n) => String(n).padStart(2, "0");

/**
 * One month of one customer's transactions, oldest first.
 * @param {object} customer
 * @param {number} year
 * @param {number} month 0-based
 */
export function monthOfTransactions(customer, year, month) {
  const key = `${year}-${pad(month + 1)}`;
  const r = rng(hash(`${customer.customerId}:${key}`));
  const days = daysIn(year, month);
  const out = [];
  let n = 0;
  const id = () => `txn_${customer.customerId}${year}${pad(month + 1)}${String((n += 1)).padStart(3, "0")}`;
  const at = (day) => {
    // Shopping hours, 07:00 to 21:00 SAST (05:00 to 19:00 UTC).
    const minutes = between(r, 5 * 60, 19 * 60);
    return new Date(Date.UTC(year, month, day, Math.floor(minutes / 60), minutes % 60)).toISOString();
  };

  for (const rec of RECURRING) {
    if (rec.day > days) continue;
    const amount = rec.spread ? between(r, rec.amount - rec.spread, rec.amount + rec.spread) : rec.amount;
    out.push({
      id: "", date: at(rec.day), merchant: rec.merchant, category: rec.category,
      amount: Math.round(amount * (rec.category === "Utilities" ? 1 : customer.appetite)) || amount,
      description: rec.description, paymentMethod: rec.method,
    });
  }

  for (const [category, p] of Object.entries(SPEND_PROFILE)) {
    if (!p.perMonth) continue;
    // A month is not exactly average: some are busier than others.
    const count = Math.max(0, Math.round(p.perMonth * customer.appetite * (0.75 + r() * 0.5)));
    for (let i = 0; i < count; i += 1) {
      const [merchant, sells] = pick(r, p.merchants);
      out.push({
        id: "", date: at(between(r, 1, days)), merchant, category,
        amount: Math.round(between(r, p.min, p.max) * customer.appetite),
        description: pick(r, sells), paymentMethod: pick(r, p.methods),
      });
    }
  }

  out.sort((a, b) => a.date.localeCompare(b.date));
  for (const t of out) t.id = id();
  return out;
}

/**
 * Every transaction for a customer up to `now`, oldest first. Memoised per customer
 * and month, because every request reads the whole history.
 *
 * @param {string} customerId
 * @param {Date} now
 * @returns {Array<{id: string, date: string, merchant: string, category: string, amount: number, description: string, paymentMethod: string}>} amounts in cents
 */
export function ledger(customerId, now) {
  const customer = CUSTOMERS[customerId];
  if (!customer) return null;
  const all = [];
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  for (let back = HISTORY_MONTHS - 1; back >= 0; back -= 1) {
    const d = new Date(Date.UTC(y, m - back, 1));
    all.push(...cachedMonth(customer, d.getUTCFullYear(), d.getUTCMonth()));
  }
  const cutoff = now.toISOString();
  const joined = `${customer.joinDate}T00:00:00.000Z`;
  return all.filter((t) => t.date <= cutoff && t.date >= joined);
}

const cache = new Map();
function cachedMonth(customer, year, month) {
  const k = `${customer.customerId}:${year}:${month}`;
  if (!cache.has(k)) cache.set(k, monthOfTransactions(customer, year, month));
  return cache.get(k);
}
