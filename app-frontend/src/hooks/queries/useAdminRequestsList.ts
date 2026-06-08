import { useInfiniteQuery } from "@tanstack/react-query";

import { adminService } from "../../services/admin.service";

import { AdminRequestsListFilters, queryKeys } from "./queryKeys";

export const REQUESTS_PAGE_SIZE = 25;

type ListOpsSort =
  | "createdAt:desc"
  | "createdAt:asc"
  | "updatedAt:desc"
  | "updatedAt:asc"
  | "priority:desc";

/**
 * Paginated admin ops requests list backed by `useInfiniteQuery`.
 *
 * Built on top of GET /admin/ops-requests (adminService.listOpsRequests). The hook
 * exposes a flattened list (all pages concatenated) plus the underlying
 * fetchNextPage / hasNextPage handles for onEndReached wiring.
 *
 * Auto-deduplicates concurrent requests with the same filters — this kills the
 * double-fetch loop AdminOpsConsoleScreen exhibits (useFocusEffect + debounced
 * effect both fire for the same key).
 */
export const useAdminRequestsList = (filters: AdminRequestsListFilters) => {
  const query = useInfiniteQuery({
    queryKey: queryKeys.adminOpsRequests.list(filters),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const response = await adminService.listOpsRequests({
        limit: REQUESTS_PAGE_SIZE,
        offset: pageParam,
        kind: filters.kind && filters.kind !== "all" ? filters.kind : undefined,
        statusBucket:
          filters.statusBucket && filters.statusBucket !== "all"
            ? filters.statusBucket
            : undefined,
        priority: filters.priority,
        search: filters.search?.trim() || undefined,
        sort: (filters.sort as ListOpsSort | undefined) ?? "updatedAt:desc",
        assignedTo: filters.assignedTo,
        from: filters.from,
        to: filters.to,
      });
      return response;
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore
        ? lastPage.pagination.offset + lastPage.pagination.limit
        : undefined,
  });

  const requests = query.data?.pages.flatMap((page) => page.requests) ?? [];
  const total = query.data?.pages[0]?.pagination.total ?? 0;

  return {
    requests,
    total,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    isRefetching: query.isRefetching,
    hasNextPage: Boolean(query.hasNextPage),
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    error: query.error,
  };
};
