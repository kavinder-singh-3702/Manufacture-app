/**
 * Centralised React Query key factory.
 *
 * Why a factory rather than scattered string arrays:
 *  - Single source of truth for invalidations from mutation hooks
 *  - Type-safe keys via `as const`
 *  - Lets us invalidate the whole subtree (queryClient.invalidateQueries({ queryKey: queryKeys.adminOpsRequests.all }))
 *    or a specific filter (queryKey: queryKeys.adminOpsRequests.list({ kind: 'service' }))
 *
 * Note on the dual data layer:
 *  Phase 1 of the ops rebuild only migrates the new RequestsTab to React Query.
 *  Overview / Trades / Alerts / Logs stay on useState+useFocusEffect — they don't
 *  share these keys. A mutation from AdminRequestDetail therefore can't invalidate
 *  Overview's stale open-bucket count automatically. Each legacy tab adds a
 *  useFocusEffect refetch to compensate. Phase 8 (optional) closes this gap by
 *  migrating them too.
 */

export type AdminRequestsListFilters = {
  kind?: "service" | "business_setup" | "all";
  statusBucket?: "open" | "closed" | "rejected" | "all";
  priority?: string;
  search?: string;
  sort?: string;
  assignedTo?: string;
  from?: string;
  to?: string;
};

export const queryKeys = {
  adminOpsRequests: {
    all: ["admin", "ops-requests"] as const,
    list: (filters: AdminRequestsListFilters) =>
      ["admin", "ops-requests", "list", filters] as const,
    detail: (kind: "service" | "business_setup", id: string) =>
      ["admin", "ops-requests", "detail", kind, id] as const,
  },
} as const;
