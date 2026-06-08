/**
 * Typed filter shape used by the admin Requests tab.
 *
 * Each field is optional — a missing field means "don't constrain on this axis".
 * The wire format matches the backend's `listOpsRequestsAdmin` query parameters,
 * so the hook can spread these directly into the API call.
 */

export type RequestsKindFilter = "all" | "service" | "business_setup";
export type RequestsStatusBucket = "all" | "open" | "closed" | "rejected";
export type RequestsPriority = "all" | "low" | "normal" | "high" | "urgent" | "critical";

export type RequestsSort =
  | "updatedAt:desc"
  | "updatedAt:asc"
  | "createdAt:desc"
  | "createdAt:asc"
  | "priority:desc";

export type RequestsFilters = {
  kind: RequestsKindFilter;
  statusBucket: RequestsStatusBucket;
  priority: RequestsPriority;
  sort: RequestsSort;
  /** Optional ISO datetime — only requests with createdAt >= from are returned. */
  from?: string;
  /** Optional ISO datetime — only requests with createdAt <= to are returned. */
  to?: string;
  /** Optional free-text search across title / owner / reference. */
  search?: string;
};

export const DEFAULT_REQUESTS_FILTERS: RequestsFilters = {
  kind: "all",
  statusBucket: "open",
  priority: "all",
  sort: "updatedAt:desc",
};

export const SORT_LABELS: Readonly<Record<RequestsSort, string>> = Object.freeze({
  "updatedAt:desc": "Recently updated",
  "updatedAt:asc": "Oldest update",
  "createdAt:desc": "Newest created",
  "createdAt:asc": "Oldest created",
  "priority:desc": "Highest priority",
});

export const PRIORITY_LABELS: Readonly<Record<RequestsPriority, string>> = Object.freeze({
  all: "Any priority",
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
  critical: "Critical",
});

export const KIND_LABELS: Readonly<Record<RequestsKindFilter, string>> = Object.freeze({
  all: "Both kinds",
  service: "Service",
  business_setup: "Startup",
});

export const STATUS_BUCKET_LABELS: Readonly<Record<RequestsStatusBucket, string>> = Object.freeze({
  all: "Any status",
  open: "Open",
  closed: "Resolved",
  rejected: "Rejected",
});

/**
 * Counts how many filter dimensions are constrained — used by the UI to show a
 * badge on the Filters button ("Filters · 3" when three axes are active).
 */
export const countActiveFilters = (filters: RequestsFilters): number => {
  let n = 0;
  if (filters.kind !== "all") n += 1;
  if (filters.statusBucket !== "all" && filters.statusBucket !== "open") n += 1;
  if (filters.priority !== "all") n += 1;
  if (filters.sort !== "updatedAt:desc") n += 1;
  if (filters.from) n += 1;
  if (filters.to) n += 1;
  if (filters.search?.trim()) n += 1;
  return n;
};
