import { apiClient } from "./apiClient";

// Mirrors web-frontend/src/services/notification.ts exactly — there's no
// shared package between the two frontends, so this file and the web one are
// kept as literal structural mirrors of the same backend contract
// (backend/src/services/notification.service.js `formatNotification` /
// admin batch-summary shape). Change both together.

export type NotificationPriority = "low" | "normal" | "high" | "critical";
export type NotificationStatus = "read" | "unread";
export type NotificationChannel = "in_app" | "email" | "sms" | "push" | "webhook";
export type NotificationAudience = "user" | "company" | "broadcast";

export type NotificationActionType = "none" | "route" | "url" | "chat" | "call";

export type NotificationAction = {
  type: NotificationActionType;
  label?: string;
  routeName?: string;
  routeParams?: Record<string, unknown>;
  url?: string;
  phone?: string;
};

export type NotificationDelivery = {
  channel: NotificationChannel;
  status: "queued" | "sending" | "sent" | "delivered" | "failed" | "cancelled";
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
  data: Record<string, unknown>;
  action?: NotificationAction;
  channels?: NotificationChannel[];
  deliveries?: NotificationDelivery[];
  requiresAck?: boolean;
  ackAt?: string | null;
  status: NotificationStatus;
  lifecycleStatus?: string | null;
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
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

export type NotificationListResponse = {
  notifications: Notification[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

export type UnreadCountResponse = {
  count: number;
};

export type MarkReadResponse = {
  notification: Notification;
};

export type MarkAllReadResponse = {
  success: boolean;
  modifiedCount: number;
};

export type RegisterDevicePayload = {
  pushToken: string;
  platform?: "ios" | "android" | "web";
  pushProvider?: "expo";
  appVersion?: string;
  buildNumber?: string;
  deviceModel?: string;
  osVersion?: string;
  locale?: string;
  timezone?: string;
  metadata?: Record<string, unknown>;
};

export type NotificationPreferences = {
  masterEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  topicOverrides: Record<string, Partial<Record<"inApp" | "push" | "email" | "sms", boolean>>>;
  priorityOverrides: Record<string, Partial<Record<"inApp" | "push" | "email" | "sms", boolean>>>;
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
  notification?: Notification;
  notificationIds?: string[];
  count?: number;
  skipped?: number;
  audience?: NotificationAudience;
};

export type Pagination = { total: number; limit: number; offset: number; hasMore: boolean };

// One row per dispatch (a broadcast/company/multi-user send fans out to many
// per-recipient docs sharing a batchId — admin screens operate on the batch,
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
  deliveryRollup: Record<string, Partial<Record<NotificationDelivery["status"], number>>>;
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

class NotificationService {
  async getNotifications(params?: NotificationListParams): Promise<NotificationListResponse> {
    return apiClient.get<NotificationListResponse>("/notifications", {
      params: params
        ? {
            ...params,
            archived: params.archived === undefined ? undefined : String(params.archived),
          }
        : undefined,
    });
  }

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<UnreadCountResponse>("/notifications/unread-count");
    return response.count;
  }

  async markAsRead(notificationId: string): Promise<MarkReadResponse> {
    return apiClient.patch<MarkReadResponse>(`/notifications/${notificationId}/read`);
  }

  async markAllAsRead(): Promise<MarkAllReadResponse> {
    return apiClient.patch<MarkAllReadResponse>("/notifications/read-all");
  }

  async archive(notificationId: string): Promise<MarkReadResponse> {
    return apiClient.patch<MarkReadResponse>(`/notifications/${notificationId}/archive`);
  }

  async unarchive(notificationId: string): Promise<MarkReadResponse> {
    return apiClient.patch<MarkReadResponse>(`/notifications/${notificationId}/unarchive`);
  }

  async acknowledge(notificationId: string): Promise<MarkReadResponse> {
    return apiClient.post<MarkReadResponse>(`/notifications/${notificationId}/ack`);
  }

  async registerDevice(payload: RegisterDevicePayload): Promise<{ device: unknown }> {
    return apiClient.post<{ device: unknown }>("/notifications/devices/register", payload);
  }

  async unregisterDevice(pushToken: string): Promise<{ device: unknown }> {
    return apiClient.delete<{ device: unknown }>(`/notifications/devices/${encodeURIComponent(pushToken)}`);
  }

  async getPreferences(): Promise<NotificationPreferences> {
    const response = await apiClient.get<{ preferences: NotificationPreferences }>("/notifications/preferences");
    return response.preferences;
  }

  async updatePreferences(payload: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await apiClient.patch<{ preferences: NotificationPreferences }>("/notifications/preferences", payload);
    return response.preferences;
  }

  async dispatch(payload: AdminDispatchPayload): Promise<AdminDispatchResponse> {
    return apiClient.post<AdminDispatchResponse>("/notifications/dispatch", payload);
  }

  // Batch-aggregated admin history — a broadcast/company/multi-user dispatch
  // fans out to one Notification doc per recipient sharing a batchId, and
  // these three methods operate on the batch as a whole rather than the raw
  // recipient rows (backend/src/services/notification.service.js
  // listAdminNotifications/getAdminBatch/cancelAdminBatch/resendAdminBatch).
  async listAdminNotifications(params?: {
    userId?: string;
    topic?: string;
    priority?: NotificationPriority;
    eventKey?: string;
    audience?: NotificationAudience;
    status?: string;
    mine?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<AdminBatchListResponse> {
    return apiClient.get<AdminBatchListResponse>("/notifications/admin", { params });
  }

  async getAdminBatch(batchId: string, params?: { limit?: number; offset?: number }): Promise<AdminBatchDetailResponse> {
    return apiClient.get<AdminBatchDetailResponse>(`/notifications/admin/batches/${batchId}`, { params });
  }

  async cancelAdminBatch(batchId: string): Promise<AdminBatchDetailResponse> {
    return apiClient.patch<AdminBatchDetailResponse>(`/notifications/admin/batches/${batchId}/cancel`);
  }

  async resendAdminBatch(batchId: string): Promise<AdminDispatchResponse> {
    return apiClient.post<AdminDispatchResponse>(`/notifications/admin/batches/${batchId}/resend`);
  }
}

export const notificationService = new NotificationService();
