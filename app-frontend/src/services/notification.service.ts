import { apiClient } from "./apiClient";

export type NotificationPriority = "low" | "normal" | "high" | "critical";
export type NotificationStatus = "read" | "unread";
export type NotificationChannel = "in_app" | "email" | "sms" | "push" | "webhook";

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
  audience?: "user" | "company" | "broadcast";
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
};

export type AdminDispatchResponse = {
  success: boolean;
  notificationId?: string;
  notification?: Notification;
  notificationIds?: string[];
  count?: number;
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

  async listAdminNotifications(params?: {
    userId?: string;
    topic?: string;
    priority?: NotificationPriority;
    eventKey?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<NotificationListResponse> {
    return apiClient.get<NotificationListResponse>("/notifications/admin", { params });
  }

  async getAdminNotification(notificationId: string): Promise<Notification> {
    const response = await apiClient.get<{ notification: Notification }>(`/notifications/admin/${notificationId}`);
    return response.notification;
  }

  async cancelAdminNotification(notificationId: string): Promise<Notification> {
    const response = await apiClient.patch<{ notification: Notification }>(`/notifications/admin/${notificationId}/cancel`);
    return response.notification;
  }

  async resendAdminNotification(notificationId: string): Promise<AdminDispatchResponse> {
    return apiClient.post<AdminDispatchResponse>(`/notifications/admin/${notificationId}/resend`);
  }
}

export const notificationService = new NotificationService();
