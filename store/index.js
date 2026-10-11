/**
 * The Redux store: the customer's preferences, persisted to the browser.
 *
 * Server data is not in Redux at all; TanStack Query holds it (hooks/useSpendingApi.js).
 * So the store is small, persisting it is safe, and nothing financial is ever written
 * to localStorage.
 *
 * `makeStore` is a factory, not a singleton, so every test gets a fresh store and the
 * server never shares one store between two visitors.
 */
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER,
} from "redux-persist";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import preferences from "./preferencesSlice";

/**
 * localStorage in the browser; a no-op during server rendering, where there is no
 * window. Importing redux-persist's default storage directly throws on the server.
 */
function storage() {
  if (typeof window !== "undefined") return createWebStorage("local");
  return {
    getItem: () => Promise.resolve(null),
    setItem: (_k, v) => Promise.resolve(v),
    removeItem: () => Promise.resolve(),
  };
}

export const PERSIST_KEY = "capitec-insights";

const rootReducer = combineReducers({ preferences });

export function makeStore({ persist = true, preloadedState } = {}) {
  const reducer = persist
    ? persistReducer({ key: PERSIST_KEY, version: 1, storage: storage(), whitelist: ["preferences"] }, rootReducer)
    : rootReducer;
  const store = configureStore({
    reducer,
    preloadedState,
    middleware: (gdm) =>
      // redux-persist's own actions carry functions; everything else must stay serialisable.
      gdm({ serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] } }),
  });
  return { store, persistor: persist ? persistStore(store) : null };
}
