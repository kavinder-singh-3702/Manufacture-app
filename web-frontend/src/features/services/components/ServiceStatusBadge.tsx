import type { ServicePriority, ServiceStatus } from "@/src/types/service";

const STATUS_META: Record<ServiceStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending:     { label: "Pending",      bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  in_review:   { label: "In review",    bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
  scheduled:   { label: "Scheduled",    bg: "#EDE9FE", text: "#5B21B6", dot: "#8B5CF6" },
  in_progress: { label: "In progress",  bg: "#E0F2FE", text: "#075985", dot: "#0EA5E9" },
  completed:   { label: "Completed",    bg: "#DCFCE7", text: "#15803D", dot: "#22C55E" },
  cancelled:   { label: "Cancelled",    bg: "#F3F4F6", text: "#4B5563", dot: "#9CA3AF" },
};

const PRIORITY_META: Record<ServicePriority, { label: string; bg: string; text: string }> = {
  low:    { label: "Low",    bg: "#F3F4F6", text: "#4B5563" },
  normal: { label: "Normal", bg: "#EDE9FE", text: "#5B21B6" },
  high:   { label: "High",   bg: "#FEF3C7", text: "#92400E" },
  urgent: { label: "Urgent", bg: "#FEE2E2", text: "#991B1B" },
};

export const ServiceStatusBadge = ({ status }: { status: ServiceStatus }) => {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: meta.bg, color: meta.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
      {meta.label}
    </span>
  );
};

export const ServicePriorityBadge = ({ priority }: { priority: ServicePriority }) => {
  const meta = PRIORITY_META[priority] ?? PRIORITY_META.normal;
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: meta.bg, color: meta.text }}>
      {meta.label}
    </span>
  );
};

export { STATUS_META };
