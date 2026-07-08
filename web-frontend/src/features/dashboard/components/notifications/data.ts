import type { Notification, NotificationPriority } from "@/src/services/notification";

export type NotificationSeverity = "info" | "warning" | "critical";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  topic: string;
  priority: NotificationPriority;
  severity: NotificationSeverity;
  status: "unread" | "read";
  requiresAck: boolean;
  ackAt: string | null;
};

export const countUnread = (items: NotificationItem[] = []) =>
  items.filter((item) => item.status === "unread").length;

const severityFromPriority = (priority: NotificationPriority): NotificationSeverity => {
  if (priority === "critical") return "critical";
  if (priority === "high") return "warning";
  return "info";
};

export const toNotificationItem = (n: Notification): NotificationItem => ({
  id: n.id,
  title: n.title,
  body: n.body,
  timestamp: n.createdAt,
  topic: n.topic || "system",
  priority: n.priority,
  severity: severityFromPriority(n.priority),
  status: n.status,
  requiresAck: Boolean(n.requiresAck),
  ackAt: n.ackAt ?? null,
});
