import { apiClient } from "./apiClient";

export type NotificationPriority = "low" | "normal" | "high" | "critical";
export type NotificationStatus = "read" | "unread";

export type Notification = {
  id: string;
  title: string;
  body: string;
  eventKey: string;
  topic: string;
  priority: NotificationPriority;
  data: Record<string, unknown>;
  status: NotificationStatus;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListParams = {
  status?: "read" | "unread";
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

class NotificationService {
  /**
   * Get list of notifications for the current user
   */
  async getNotifications(params?: NotificationListParams): Promise<NotificationListResponse> {
    return apiClient.get<NotificationListResponse>("/notifications", { params });
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<UnreadCountResponse>("/notifications/unread-count");
    return response.count;
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<MarkReadResponse> {
    return apiClient.patch<MarkReadResponse>(`/notifications/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<MarkAllReadResponse> {
    return apiClient.patch<MarkAllReadResponse>("/notifications/read-all");
  }
}

export const notificationService = new NotificationService();
