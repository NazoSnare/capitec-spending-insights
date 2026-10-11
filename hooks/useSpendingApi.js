/**
 * One hook per endpoint in the brief, built on TanStack Query.
 *
 * TanStack Query owns server state: loading, errors, retries, caching and refetching
 * when the customer returns to the tab. Redux owns client state (the preferences, in
 * store/). The split is deliberate: figures are never persisted to the browser,
 * because yesterday's spending shown as today's is worse than a loading skeleton.
 *
 * Query keys start with the customer id, so switching customer can never show one
 * customer's figures under another's name, and `invalidateQueries({ queryKey:
 * ["customer", id] })` refreshes everything for one customer at once.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";

export const keys = {
  all: (customerId) => ["customer", customerId],
  profile: (customerId) => ["customer", customerId, "profile"],
  summary: (customerId, period) => ["customer", customerId, "summary", { period }],
  categories: (customerId, range) => ["customer", customerId, "categories", range],
  trends: (customerId, months) => ["customer", customerId, "trends", { months }],
  transactions: (customerId, params) => ["customer", customerId, "transactions", params],
  goals: (customerId) => ["customer", customerId, "goals"],
  filters: (customerId) => ["customer", customerId, "filters"],
};

const base = (customerId) => `customers/${encodeURIComponent(customerId)}`;

export const useProfile = (customerId) =>
  useQuery({ queryKey: keys.profile(customerId), queryFn: ({ signal }) => apiGet(`${base(customerId)}/profile`, null, signal) });

export const useSummary = ({ customerId, period }) =>
  useQuery({ queryKey: keys.summary(customerId, period), queryFn: ({ signal }) => apiGet(`${base(customerId)}/spending/summary`, { period }, signal) });

export const useCategories = ({ customerId, period, startDate, endDate }) => {
  const range = startDate && endDate ? { startDate, endDate } : { period };
  return useQuery({
    queryKey: keys.categories(customerId, range),
    queryFn: ({ signal }) => apiGet(`${base(customerId)}/spending/categories`, range, signal),
    // Keep the previous split on screen while a new period loads, rather than blanking it.
    placeholderData: keepPreviousData,
  });
};

export const useTrends = ({ customerId, months = 12 }) =>
  useQuery({
    queryKey: keys.trends(customerId, months),
    queryFn: ({ signal }) => apiGet(`${base(customerId)}/spending/trends`, { months }, signal),
    placeholderData: keepPreviousData,
  });

export const useTransactions = ({ customerId, ...params }, { enabled = true } = {}) =>
  useQuery({
    queryKey: keys.transactions(customerId, params),
    queryFn: ({ signal }) => apiGet(`${base(customerId)}/transactions`, params, signal),
    // Paging keeps the current page visible until the next one arrives.
    placeholderData: keepPreviousData,
    enabled,
  });

export const useGoals = (customerId) =>
  useQuery({ queryKey: keys.goals(customerId), queryFn: ({ signal }) => apiGet(`${base(customerId)}/goals`, null, signal) });

/** The filter options hardly ever change, so they are kept fresh for longer. */
export const useFilters = (customerId) =>
  useQuery({ queryKey: keys.filters(customerId), queryFn: ({ signal }) => apiGet(`${base(customerId)}/filters`, null, signal), staleTime: 10 * 60_000 });
