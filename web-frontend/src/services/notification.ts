import { httpClient, QueryParams } from "../lib/http-client";

// ── Types ──────────────────────────────────────────────────────────────────────
// Mirrors backend/src/services/notification.service.js `formatNotification` /
// the admin batch-summary shape exactly — app-frontend/src/services/
// notification.service.ts is kept as a literal structural mirror of this
// file (there's no shared package in this repo), so change both together.

export type NotificationPriority = "low" | "normal" | "high" | "critical";
export type NotificationChannel = "in_app" | "email" | "sms" | "push" | "webhook";
export type NotificationActionType = "none" | "route" | "url" | "chat" | "call";
export type NotificationAudience = "user" | "company" | "broadcast";

export type NotificationAction = {
  type: NotificationActionType;
  label?: string;
  routeName?: string;
  routeParams?: Record<string, unknown>;
  url?: string;
  phone?: string;
};

export type NotificationDeliveryStatus = "queued" | "sending" | "sent" | "delivered" | "failed" | "cancelled";

export type NotificationDelivery = {
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  requestedAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  failureAt?: string;
  errorCode?: string;
  errorMessage?: string;
};

export type Notification = {
  id: string;
  batchId: string;
  title: string;
  body: string;
  eventKey: string;
  topic: string;
  priority: NotificationPriority;
  data?: Record<string, unknown>;
  action?: NotificationAction;
  channels?: NotificationChannel[];
  deliveries?: NotificationDelivery[];
  requiresAck?: boolean;
  ackAt?: string | null;
  lifecycleStatus?: string | null;
  status: "read" | "unread";
  readAt: string | null;
  archivedAt?: string | null;
  createdAt: string;
};

export type NotificationListParams = {
  status?: "read" | "unread";
  topic?: string;
  priority?: NotificationPriority;
  archived?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
};

export type Pagination = { total: number; limit: number; offset: number; hasMore: boolean };

export type NotificationListResponse = {
  notifications: Notification[];
  pagination: Pagination;
};

// One row per dispatch (a broadcast/company/multi-user send fans out to many
// per-recipient docs sharing a batchId — the admin UI operates on the batch,
// not the raw recipient rows).
export type AdminNotificationBatch = {
  batchId: string;
  title: string;
  body: string;
  eventKey: string;
  topic: string;
  priority: NotificationPriority;
  audience: NotificationAudience;
  channels: NotificationChannel[];
  createdAt: string;
  scheduledAt: string | null;
  createdBy: string | null;
  createdByName: string | null;
  recipientCount: number;
  readCount: number;
  cancelledCount: number;
  completedCount: number;
  deliveryRollup: Record<string, Partial<Record<NotificationDeliveryStatus, number>>>;
};

export type AdminBatchListResponse = {
  notifications: AdminNotificationBatch[];
  pagination: Pagination;
};

export type AdminBatchDetailResponse = {
  batch: AdminNotificationBatch;
  recipients: Notification[];
  pagination: Pagination;
};

export type AdminDispatchPayload = {
  audience?: NotificationAudience;
  userId?: string;
  userIds?: string[];
  companyId?: string;
  title: string;
  body: string;
  eventKey: string;
  topic?: string;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  data?: Record<string, unknown>;
  action?: NotificationAction;
  isSilent?: boolean;
  requiresAck?: boolean;
  scheduledAt?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  deliveryPolicy?: Partial<{
    respectQuietHours: boolean;
    allowPush: boolean;
    allowInApp: boolean;
    allowEmail: boolean;
    maxRetries: number;
    allowCriticalOverride: boolean;
  }>;
};

export type AdminDispatchResponse = {
  success: boolean;
  batchId?: string;
  notificationId?: string;
  notificationIds?: string[];
  count?: number;
  skipped?: number;
  audience?: NotificationAudience;
};

export type NotificationQuietHours = {
  enabled: boolean;
  start: string;
  end: string;
  timezone: string;
};

export type NotificationPreferences = {
  masterEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHours: NotificationQuietHours;
  topicOverrides: Record<string, Partial<Record<"inApp" | "push" | "email" | "sms", boolean>>>;
  priorityOverrides: Record<string, Partial<Record<"inApp" | "push" | "email" | "sms", boolean>>>;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const toQuery = (params?: Record<string, unknown>): QueryParams | undefined => {
  if (!params) return undefined;
  const out: QueryParams = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") out[k] = v;
    }
  });
  return Object.keys(out).length ? out : undefined;
};

// ── Service ───────────────────────────────────────────────────────────────────

const dispatch = (payload: AdminDispatchPayload) =>
  httpClient.post<AdminDispatchResponse>("/notifications/dispatch", payload);

const listAdmin = (params?: {
  topic?: string;
  priority?: NotificationPriority;
  audience?: NotificationAudience;
  status?: string;
  mine?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}) => httpClient.get<AdminBatchListResponse>("/notifications/admin", { params: toQuery(params as Record<string, unknown>) });

const getAdminBatch = (batchId: string, params?: { limit?: number; offset?: number }) =>
  httpClient.get<AdminBatchDetailResponse>(`/notifications/admin/batches/${batchId}`, { params: toQuery(params as Record<string, unknown>) });

const cancelAdminBatch = (batchId: string) =>
  httpClient.patch<AdminBatchDetailResponse>(`/notifications/admin/batches/${batchId}/cancel`);

const resendAdminBatch = (batchId: string) =>
  httpClient.post<AdminDispatchResponse>(`/notifications/admin/batches/${batchId}/resend`);

// End-user inbox — same endpoints the mobile app's notification.service.ts uses.

const list = (params?: NotificationListParams) =>
  httpClient.get<NotificationListResponse>("/notifications", { params: toQuery(params as Record<string, unknown>) });

const getUnreadCount = () =>
  httpClient.get<{ count: number }>("/notifications/unread-count").then((r) => r.count);

const markAsRead = (notificationId: string) =>
  httpClient.patch<{ notification: Notification }>(`/notifications/${notificationId}/read`).then((r) => r.notification);

const markAllAsRead = () =>
  httpClient.patch<{ success: boolean; modifiedCount: number }>("/notifications/read-all");

const archive = (notificationId: string) =>
  httpClient.patch<{ notification: Notification }>(`/notifications/${notificationId}/archive`).then((r) => r.notification);

const unarchive = (notificationId: string) =>
  httpClient.patch<{ notification: Notification }>(`/notifications/${notificationId}/unarchive`).then((r) => r.notification);

const acknowledge = (notificationId: string) =>
  httpClient.post<{ notification: Notification }>(`/notifications/${notificationId}/ack`).then((r) => r.notification);

const getPreferences = () =>
  httpClient
    .get<{ preferences: NotificationPreferences }>("/notifications/preferences")
    .then((r) => r.preferences);

const updatePreferences = (payload: Partial<NotificationPreferences>) =>
  httpClient
    .patch<{ preferences: NotificationPreferences }>("/notifications/preferences", payload)
    .then((r) => r.preferences);

export const notificationService = {
  dispatch,
  listAdmin,
  getAdminBatch,
  cancelAdminBatch,
  resendAdminBatch,
  list,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  archive,
  unarchive,
  acknowledge,
  getPreferences,
  updatePreferences,
};
