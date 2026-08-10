import { apiClient } from "./apiClient";

/**
 * Report + Block APIs backing Apple App Store Guideline 1.2 (user-generated
 * content safety). Users can flag bad content to admins and block bad
 * actors; admins triage reports from the Command Center.
 */

export type ReportTargetType = "product" | "message" | "user";

export type ReportReason =
  | "spam"
  | "scam_or_fraud"
  | "inappropriate"
  | "harassment"
  | "counterfeit_or_misleading"
  | "other";

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: "Spam or repetitive posting",
  scam_or_fraud: "Scam or fraud",
  inappropriate: "Inappropriate or offensive content",
  harassment: "Harassment or abusive behaviour",
  counterfeit_or_misleading: "Counterfeit or misleading listing",
  other: "Something else",
};

export type AdminReport = {
  id: string;
  reporter?: { _id?: string; displayName?: string; email?: string; role?: string } | null;
  targetType: ReportTargetType;
  targetId: string;
  targetOwner?: { _id?: string; displayName?: string; email?: string; role?: string } | null;
  reason: ReportReason;
  details?: string;
  status: "pending" | "resolved" | "dismissed";
  resolvedBy?: { _id?: string; displayName?: string; email?: string } | null;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export type BlockedUserEntry = {
  id: string;
  blocked: { _id?: string; displayName?: string; email?: string; avatarUrl?: string; role?: string } | null;
  reason?: string;
  createdAt: string;
};

const submitReport = (payload: {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}) => apiClient.post<{ report: AdminReport }>("/reports", payload);

const listReports = (params?: {
  status?: "pending" | "resolved" | "dismissed";
  targetType?: ReportTargetType;
  limit?: number;
  offset?: number;
}) =>
  apiClient.get<{
    reports: AdminReport[];
    pagination: { total: number; limit: number; offset: number; hasMore: boolean };
    counters: { pending: number };
  }>("/reports/admin", { params });

const resolveReport = (reportId: string, payload: { action: "resolved" | "dismissed"; notes?: string }) =>
  apiClient.post<{ report: AdminReport }>(`/reports/admin/${reportId}/resolve`, payload);

const blockUser = (userId: string, reason?: string) =>
  apiClient.post<{ alreadyBlocked?: boolean }>(`/blocks/${userId}`, reason ? { reason } : {});

const unblockUser = (userId: string) => apiClient.delete<{ removed: boolean }>(`/blocks/${userId}`);

const listMyBlocks = () => apiClient.get<{ blocks: BlockedUserEntry[] }>("/blocks");

export const moderationService = {
  submitReport,
  listReports,
  resolveReport,
  blockUser,
  unblockUser,
  listMyBlocks,
};
