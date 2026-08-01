import { tintBg } from "@/src/lib/color";
import type { ServicePriority, ServiceStatus } from "@/src/types/service";

/**
 * Status/priority pills, rebuilt on `tintBg()` (src/lib/color.ts) instead of
 * hardcoded light-only pastels (`#FEF3C7`, `#DBEAFE`, ...). Those pastels are
 * exactly the pattern `tintBg`'s docblock calls out as illegible in dark
 * mode — this file was the bug it was written to fix but never migrated.
 */

type Tone = "neutral" | "warning" | "info" | "progress" | "success" | "danger";

const TONE_ANCHOR: Record<Tone, string> = {
  neutral: "#6B7280",
  warning: "#D97706",
  info: "#2563EB",
  progress: "#0EA5E9",
  success: "#16A34A",
  danger: "#DC2626",
};

const STATUS_META: Record<ServiceStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pending", tone: "warning" },
  in_review: { label: "In Review", tone: "info" },
  scheduled: { label: "Scheduled", tone: "neutral" },
  in_progress: { label: "In Progress", tone: "progress" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

const PRIORITY_META: Record<ServicePriority, { label: string; tone: Tone }> = {
  low: { label: "Low", tone: "neutral" },
  normal: { label: "Normal", tone: "info" },
  high: { label: "High", tone: "warning" },
  urgent: { label: "Urgent", tone: "danger" },
};

const Pill = ({ label, tone }: { label: string; tone: Tone }) => {
  const anchor = TONE_ANCHOR[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: tintBg(anchor, 16), color: anchor, border: `1px solid ${tintBg(anchor, 35)}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: anchor }} />
      {label}
    </span>
  );
};

export const ServiceStatusBadge = ({ status }: { status: ServiceStatus }) => {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  return <Pill label={meta.label} tone={meta.tone} />;
};

export const ServicePriorityBadge = ({ priority }: { priority: ServicePriority }) => {
  const meta = PRIORITY_META[priority] ?? PRIORITY_META.normal;
  return <Pill label={meta.label} tone={meta.tone} />;
};

export { STATUS_META, PRIORITY_META };
