export type NotificationSeverity = "info" | "warning" | "critical" | "success";
export type NotificationCategory = "orders" | "compliance" | "system" | "billing" | "product";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  status: "unread" | "read";
  actor?: string;
  tags?: string[];
  actionLabel?: string;
};

export const countUnread = (items: NotificationItem[] = []) =>
  items.filter((item) => item.status === "unread").length;

const CATEGORY_MAP: Record<string, NotificationCategory> = {
  order: "orders", orders: "orders",
  compliance: "compliance", verification: "compliance",
  billing: "billing", invoice: "billing", payment: "billing",
  product: "product", inventory: "product",
};

const SEVERITY_MAP: Record<string, NotificationSeverity> = {
  created: "success", approved: "success", completed: "success",
  failed: "critical", rejected: "critical", error: "critical",
  warning: "warning", expiring: "warning", pending: "warning",
};

export const categoryFromAction = (action: string, category?: string): NotificationCategory => {
  const raw = (category ?? action ?? "").toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (raw.includes(key)) return val;
  }
  return "system";
};

export const severityFromAction = (action: string): NotificationSeverity => {
  const parts = action.toLowerCase().split(".");
  for (const part of parts) {
    for (const [key, val] of Object.entries(SEVERITY_MAP)) {
      if (part.includes(key)) return val;
    }
  }
  return "info";
};
