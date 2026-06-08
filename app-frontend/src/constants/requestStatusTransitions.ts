/**
 * Allowed status transitions for ops requests.
 *
 * SOURCE OF TRUTH — these must mirror the backend's STATUS_TRANSITIONS:
 *   - backend/src/modules/services/services/serviceRequest.service.js L20-27
 *   - backend/src/modules/businessSetup/services/businessSetup.service.js L30-38
 *
 * If you change a transition map there, mirror it here. Phase 3 of the ops
 * rebuild adds an `allowedTransitions` field to the backend's admin shape
 * response so the client can drop these constants and read from the server.
 * Until then, this file is the client fallback.
 */

import { AdminOpsRequest } from "../services/admin.service";

export type RequestKind = AdminOpsRequest["kind"];

export const SERVICE_STATUS_TRANSITIONS: Readonly<Record<string, string[]>> = Object.freeze({
  pending: ["in_review", "scheduled", "in_progress", "completed", "cancelled"],
  in_review: ["scheduled", "in_progress", "completed", "cancelled"],
  scheduled: ["in_progress", "completed", "cancelled"],
  in_progress: ["completed", "cancelled"],
  // completed → cancelled allowed so admin can reverse a finished request
  // (with required reason, surfaced to the requester on their own row).
  completed: ["cancelled"],
  cancelled: [],
});

export const BUSINESS_STATUS_TRANSITIONS: Readonly<Record<string, string[]>> = Object.freeze({
  new: ["contacted", "rejected", "closed"],
  contacted: ["planning", "rejected", "closed"],
  planning: ["onboarding", "rejected", "closed"],
  onboarding: ["launched", "rejected", "closed"],
  launched: ["closed"],
  closed: [],
  rejected: [],
});

/**
 * UX-friendly labels for each status across both kinds. Falls back to a
 * Title-Cased copy of the raw status if not listed.
 */
export const STATUS_LABELS: Readonly<Record<string, string>> = Object.freeze({
  // Service
  pending: "Pending",
  in_review: "In Review",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  // Business setup
  new: "New",
  contacted: "Contacted",
  planning: "Planning",
  onboarding: "Onboarding",
  launched: "Launched",
  closed: "Closed",
  rejected: "Rejected",
});

export const toStatusLabel = (status?: string): string => {
  if (!status) return "—";
  if (STATUS_LABELS[status]) return STATUS_LABELS[status];
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * The "primary" next status for a given status — the one that should be the
 * default Advance action. For services it's the natural lifecycle step (pending →
 * in_review → scheduled → ...). For business setup the same pattern (new →
 * contacted → planning → ...).
 */
const SERVICE_PRIMARY_NEXT: Readonly<Record<string, string | undefined>> = Object.freeze({
  pending: "in_review",
  in_review: "scheduled",
  scheduled: "in_progress",
  in_progress: "completed",
});

const BUSINESS_PRIMARY_NEXT: Readonly<Record<string, string | undefined>> = Object.freeze({
  new: "contacted",
  contacted: "planning",
  planning: "onboarding",
  onboarding: "launched",
  launched: "closed",
});

export type AllowedTransition = {
  status: string;
  label: string;
  /** True for the natural-flow next step (becomes the "Advance" CTA). */
  isPrimary: boolean;
};

export const allowedTransitionsFor = (kind: RequestKind, status: string): AllowedTransition[] => {
  const map = kind === "service" ? SERVICE_STATUS_TRANSITIONS : BUSINESS_STATUS_TRANSITIONS;
  const primaryMap = kind === "service" ? SERVICE_PRIMARY_NEXT : BUSINESS_PRIMARY_NEXT;
  const next = map[status] || [];
  const primary = primaryMap[status];
  return next.map((target) => ({
    status: target,
    label: toStatusLabel(target),
    isPrimary: target === primary,
  }));
};
