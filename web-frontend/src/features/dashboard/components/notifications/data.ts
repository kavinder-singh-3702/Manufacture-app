import type { Notification, NotificationAction, NotificationPriority } from "@/src/services/notification";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  topic: string;
  priority: NotificationPriority;
  status: "unread" | "read";
  requiresAck: boolean;
  ackAt: string | null;
  action?: NotificationAction;
  data?: Record<string, unknown>;
};

/**
 * 4-way priority palette matching the app's `priorityPalette`
 * (app-frontend/src/screens/NotificationsScreen.tsx) — low/normal/high/critical
 * mapped onto the real theme tokens instead of a 3-way info/warning/critical
 * collapse with hardcoded hexes.
 */
export const priorityMeta: Record<NotificationPriority, { label: string; color: string }> = {
  low: { label: "Low", color: "var(--medium-gray)" },
  normal: { label: "Normal", color: "var(--primary)" },
  high: { label: "High", color: "var(--warning)" },
  critical: { label: "Critical", color: "var(--error)" },
};

export const toNotificationItem = (n: Notification): NotificationItem => ({
  id: n.id,
  title: n.title,
  body: n.body,
  timestamp: n.createdAt,
  topic: n.topic || "system",
  priority: n.priority,
  status: n.status,
  requiresAck: Boolean(n.requiresAck),
  ackAt: n.ackAt ?? null,
  action: n.action,
  data: n.data,
});
