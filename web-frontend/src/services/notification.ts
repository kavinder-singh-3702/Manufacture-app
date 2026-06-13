import { httpClient, QueryParams } from "../lib/http-client";

// ── Types ──────────────────────────────────────────────────────────────────────

export type NotificationPriority = "low" | "normal" | "high" | "critical";
export type NotificationChannel = "in_app" | "email" | "sms" | "push" | "webhook";

export type NotificationDelivery = {
  channel: NotificationChannel;
  status?: string;
  error?: string;
  sentAt?: string;
};

export type AdminNotification = {
  id: string;
  title: string;
  body: string;
  eventKey: string;
  topic: string;
  priority: NotificationPriority;
  channels?: NotificationChannel[];
  deliveries?: NotificationDelivery[];
  lifecycleStatus?: string | null;
  status: "read" | "unread";
  createdAt: string;
};

export type AdminNotificationListResponse = {
  notifications: AdminNotification[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
};

export type AdminDispatchPayload = {
  audience?: "user" | "company" | "broadcast";
  userId?: string;
  companyId?: string;
  title: string;
  body: string;
  eventKey: string;
  topic?: string;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  scheduledAt?: string;
};

export type AdminDispatchResponse = {
  success: boolean;
  notificationId?: string;
  notificationIds?: string[];
  count?: number;
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

const listAdmin = (params?: { topic?: string; priority?: NotificationPriority; search?: string; limit?: number; offset?: number }) =>
  httpClient.get<AdminNotificationListResponse>("/notifications/admin", { params: toQuery(params as Record<string, unknown>) });

const cancelAdmin = (notificationId: string) =>
  httpClient.patch<{ notification: AdminNotification }>(`/notifications/admin/${notificationId}/cancel`)
    .then((r) => r.notification);

const resendAdmin = (notificationId: string) =>
  httpClient.post<AdminDispatchResponse>(`/notifications/admin/${notificationId}/resend`);

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
  cancelAdmin,
  resendAdmin,
  getPreferences,
  updatePreferences,
};
