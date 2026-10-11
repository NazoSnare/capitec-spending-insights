"use client";

/**
 * Redux (preferences) and TanStack Query (server data) for the whole app.
 *
 * Both are created once per browser tab (useState with an initialiser), never at module
 * level, so server rendering cannot share a store or a cache between two visitors.
 *
 * PersistGate holds rendering until saved preferences are read back, so the page
 * does not flash the default period, fetch it, then jump to the saved one.
 */
import { useState } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeStore } from "@/store";
import { makeQueryClient } from "@/lib/queryClient";

export default function Providers({ children }) {
  const [{ store, persistor }] = useState(() => makeStore());
  const [queryClient] = useState(makeQueryClient);
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <PersistGate loading={null} persistor={persistor}>{children}</PersistGate>
      </QueryClientProvider>
    </Provider>
  );
}
