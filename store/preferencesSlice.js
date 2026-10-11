/**
 * What the customer has chosen: which period, which filters, how the list is sorted,
 * whether amounts are hidden. Persisted, so the dashboard opens the way it was left.
 *
 * Only choices live here, never figures. Figures come from the API every time.
 */
import { createSlice } from "@reduxjs/toolkit";

export const DEFAULT_CUSTOMER = "12345";

export const initialState = {
  customerId: DEFAULT_CUSTOMER,
  /** The quick period for the summary and the category split. */
  period: "30d",
  /** A custom range for the category split; overrides `period` when set. */
  customRange: null,
  /** Months shown on the trend chart. */
  trendMonths: 12,
  transactions: { category: "", sortBy: "date_desc", pageSize: 20, startDate: "", endDate: "", page: 0 },
  /** Hide rand amounts on screen, for when someone is looking over a shoulder. */
  hideAmounts: false,
};

const slice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
    setPeriod: (s, { payload }) => { s.period = payload; s.customRange = null; },
    setCustomRange: (s, { payload }) => { s.customRange = payload?.startDate && payload?.endDate ? payload : null; },
    setTrendMonths: (s, { payload }) => { s.trendMonths = Math.min(24, Math.max(1, Number(payload) || 12)); },
    // Any change to what is listed starts again from the first page: page 4 of a new
    // filter may not exist.
    setTransactionFilter: (s, { payload }) => { s.transactions = { ...s.transactions, ...payload, page: 0 }; },
    setTransactionPage: (s, { payload }) => { s.transactions.page = Math.max(0, payload); },
    resetTransactionFilters: (s) => { s.transactions = { ...initialState.transactions, pageSize: s.transactions.pageSize }; },
    toggleHideAmounts: (s) => { s.hideAmounts = !s.hideAmounts; },
    // A different customer must not inherit the last one's filters.
    setCustomer: (s, { payload }) => ({ ...initialState, customerId: payload, hideAmounts: s.hideAmounts }),
  },
});

export const {
  setPeriod, setCustomRange, setTrendMonths, setTransactionFilter, setTransactionPage,
  resetTransactionFilters, toggleHideAmounts, setCustomer,
} = slice.actions;
export default slice.reducer;

/* Selectors */
export const selectPrefs = (state) => state.preferences;
export const selectCustomerId = (state) => state.preferences.customerId;
export const selectHideAmounts = (state) => state.preferences.hideAmounts;
