import { QueryClient } from "@tanstack/react-query";

/**
 * Single shared QueryClient for the app.
 *
 * Defaults tuned for ARVANN's admin surfaces:
 * - staleTime 30s → most admin list views can serve cached data for half a minute
 *   without feeling stale; user-triggered refetches still bypass this.
 * - gcTime 5min   → keep recently-used queries in memory across screen mounts so
 *   tab switches inside CommandCenter feel instant.
 * - refetchOnWindowFocus disabled — React Native handles this via useFocusEffect at
 *   the screen level; the web default would double-fetch and waste battery.
 * - retry 1       → one retry on transient network errors, then surface to user.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
