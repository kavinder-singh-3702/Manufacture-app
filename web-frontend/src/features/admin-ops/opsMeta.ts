import { tintBg } from "@/src/lib/color";
import type { AdminOpsRequest } from "@/src/services/admin";

// ── Enums (mirror backend/src/constants/services.js + businessSetup.js) ────────

export const SERVICE_TYPES = ["machine_repair", "worker", "transport", "advertisement"] as const;
export const SERVICE_STATUSES = ["pending", "in_review", "scheduled", "in_progress", "completed", "cancelled"] as const;
export const BUSINESS_STATUSES = ["new", "contacted", "planning", "onboarding", "launched", "closed", "rejected"] as const;
export const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  machine_repair: "Machine repair",
  worker: "Worker",
  transport: "Transport",
  advertisement: "Advertisement",
};

// ── Labels ───────────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_review: "In Review",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  new: "New",
  contacted: "Contacted",
  planning: "Planning",
  onboarding: "Onboarding",
  launched: "Launched",
  closed: "Closed",
  rejected: "Rejected",
};

export const toStatusLabel = (status?: string): string => {
  if (!status) return "—";
  if (STATUS_LABELS[status]) return STATUS_LABELS[status];
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export const STATUS_TONE: Record<string, string> = {
  pending: "var(--warning)",
  in_review: "#1E40AF",
  scheduled: "#5B21B6",
  in_progress: "#0E7490",
  completed: "var(--success)",
  new: "#1E40AF",
  contacted: "#0E7490",
  planning: "#5B21B6",
  onboarding: "#0369A1",
  launched: "var(--success)",
  closed: "var(--success)",
  cancelled: "var(--medium-gray)",
  rejected: "var(--danger-strong)",
};

export const statusTone = (status: string) => STATUS_TONE[status] ?? "var(--medium-gray)";
export const statusBg = (status: string) => tintBg(statusTone(status));

export const PRIORITY_TONE: Record<string, string> = {
  urgent: "var(--danger-strong)",
  high: "var(--warning)",
  normal: "#1E40AF",
  low: "var(--medium-gray)",
};

export const priorityTone = (priority: string) => PRIORITY_TONE[priority] ?? "var(--medium-gray)";
export const priorityBg = (priority: string) => tintBg(priorityTone(priority));

// ── Relative time / SLA ─────────────────────────────────────────────────────────

export const relativeAge = (iso?: string) => {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

// Used at the list level (where full `allowedTransitions` aren't fetched) to
// approximate whether a request is done, so a stale SLA due date on a closed
// request doesn't render as "breached".
export const TERMINAL_STATUSES = new Set(["completed", "cancelled", "launched", "closed", "rejected"]);

export type SlaState = "none" | "ok" | "breached";

export const slaState = (slaDueAt?: string, resolved?: boolean): SlaState => {
  if (!slaDueAt || resolved) return "none";
  return new Date(slaDueAt).getTime() < Date.now() ? "breached" : "ok";
};

export const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

// ── Status transitions (client fallback — server `allowedTransitions` wins) ────
// SOURCE OF TRUTH: backend/src/modules/services/services/serviceRequest.service.js
// and backend/src/modules/businessSetup/services/businessSetup.service.js.
// Mirrors app-frontend/src/constants/requestStatusTransitions.ts.

const SERVICE_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["in_review", "scheduled", "in_progress", "completed", "cancelled"],
  in_review: ["scheduled", "in_progress", "completed", "cancelled"],
  scheduled: ["in_progress", "completed", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: ["cancelled"],
  cancelled: [],
};

const BUSINESS_STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ["contacted", "rejected", "closed"],
  contacted: ["planning", "rejected", "closed"],
  planning: ["onboarding", "rejected", "closed"],
  onboarding: ["launched", "rejected", "closed"],
  launched: ["closed"],
  closed: [],
  rejected: [],
};

const SERVICE_PRIMARY_NEXT: Record<string, string | undefined> = {
  pending: "in_review",
  in_review: "scheduled",
  scheduled: "in_progress",
  in_progress: "completed",
};

const BUSINESS_PRIMARY_NEXT: Record<string, string | undefined> = {
  new: "contacted",
  contacted: "planning",
  planning: "onboarding",
  onboarding: "launched",
  launched: "closed",
};

export type AllowedTransition = { status: string; label: string; isPrimary: boolean };

export const allowedTransitionsFor = (kind: AdminOpsRequest["kind"], status: string): AllowedTransition[] => {
  const map = kind === "service" ? SERVICE_STATUS_TRANSITIONS : BUSINESS_STATUS_TRANSITIONS;
  const primaryMap = kind === "service" ? SERVICE_PRIMARY_NEXT : BUSINESS_PRIMARY_NEXT;
  const next = map[status] || [];
  const primary = primaryMap[status];
  return next.map((target) => ({ status: target, label: toStatusLabel(target), isPrimary: target === primary }));
};

// ── Misc formatting helpers (ported from AdminRequestContent.tsx) ──────────────

export const humanizeKey = (key: string): string =>
  key.replace(/_/g, " ").replace(/([A-Z])/g, " $1").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).trim();

export const stringifyValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((v) => stringifyValue(v)).filter(Boolean).join(", ");
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return Object.entries(obj)
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .map(([k, v]) => `${humanizeKey(k)}: ${stringifyValue(v)}`)
      .join(" • ");
  }
  return String(value);
};
