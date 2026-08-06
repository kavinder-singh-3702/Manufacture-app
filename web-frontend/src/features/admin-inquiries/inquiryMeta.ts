import { tintBg } from "@/src/lib/color";
import type { InquiryStatus } from "@/src/services/productInquiry";

export const STATUS_LABELS: Record<InquiryStatus, string> = {
  pending: "Pending",
  seen: "Seen",
  responded: "Responded",
  closed: "Closed",
};

export const STATUS_TONE: Record<InquiryStatus, string> = {
  pending: "var(--warning)",
  seen: "#1E40AF",
  responded: "var(--success)",
  closed: "var(--medium-gray)",
};

export const statusTone = (status: InquiryStatus) => STATUS_TONE[status] ?? "var(--medium-gray)";
export const statusBg = (status: InquiryStatus) => tintBg(statusTone(status));

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

export const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
