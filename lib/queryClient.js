/**
 * The TanStack Query defaults for the app.
 *
 * - 30 s fresh: figures move with every purchase, but the dashboard's seven requests
 *   should not repeat on every click between sections.
 * - Retry twice for network and server errors, never for a 4xx: a bad request or an
 *   unknown customer is an answer, and retrying it only delays the message.
 */
import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: (count, error) => {
          const s = error?.status;
          if (typeof s === "number" && s >= 400 && s < 500) return false;
          return count < 2;
        },
      },
    },
  });
}
