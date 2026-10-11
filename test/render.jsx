/**
 * Render a component with a fresh Redux store and a fresh TanStack Query client, and
 * with `fetch` answered by the real API functions (server/spending.js) at a fixed
 * "now". So a section test exercises the hook, the client, the cache and the real
 * response shape, without a server.
 */
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import { makeStore } from "@/store";
import { initialState } from "@/store/preferencesSlice";
import * as spending from "@/server/spending";

export const NOW = new Date("2026-10-11T12:00:00Z");

const ROUTES = [
  [/^customers\/([^/]+)\/profile$/, (id) => spending.getProfile(id, NOW)],
  [/^customers\/([^/]+)\/spending\/summary$/, (id, q) => spending.getSummary(id, q, NOW)],
  [/^customers\/([^/]+)\/spending\/categories$/, (id, q) => spending.getCategories(id, q, NOW)],
  [/^customers\/([^/]+)\/spending\/trends$/, (id, q) => spending.getTrends(id, q, NOW)],
  [/^customers\/([^/]+)\/transactions$/, (id, q) => spending.getTransactions(id, q, NOW)],
  [/^customers\/([^/]+)\/goals$/, (id) => spending.getGoals(id, NOW)],
  [/^customers\/([^/]+)\/filters$/, (id) => spending.getFilters(id, NOW)],
];

/** A fetch that answers from the API functions; `fail` forces a status for matching paths. */
export function mockApi({ fail } = {}) {
  const fn = vi.fn(async (url) => {
    const u = new URL(url, "http://test");
    const path = u.pathname.replace(/^\/api\//, "");
    if (fail && fail.match.test(path)) return new Response(JSON.stringify({ error: { code: "X", message: fail.message || "Down" } }), { status: fail.status || 500 });
    for (const [re, handler] of ROUTES) {
      const m = path.match(re);
      if (!m) continue;
      try {
        return Response.json(handler(decodeURIComponent(m[1]), Object.fromEntries(u.searchParams)));
      } catch (e) {
        return Response.json({ error: { code: e.code, message: e.message } }, { status: e.status || 500 });
      }
    }
    return new Response("not found", { status: 404 });
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

export function renderWithProviders(ui, { preferences } = {}) {
  const { store } = makeStore({ persist: false, preloadedState: { preferences: { ...initialState, ...preferences } } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const utils = render(
    <Provider store={store}>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </Provider>,
  );
  return { ...utils, store, client };
}

/** Testing Library normalises the non-breaking spaces in rand amounts to plain spaces. */
export const shown = (s) => String(s).replace(/ /g, " ");
