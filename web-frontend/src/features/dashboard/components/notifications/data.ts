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

const now = Date.now();

export const mockNotifications: NotificationItem[] = [
  {
    id: "n-001",
    title: "Dispatch slot confirmed",
    body: "Trucking partner assigned for PO-2239. Driver ETA 45 mins; manifest locked.",
    timestamp: new Date(now - 15 * 60 * 1000).toISOString(),
    category: "orders",
    severity: "success",
    status: "unread",
    actor: "Logistics Desk",
    tags: ["Dispatch", "PO-2239"],
    actionLabel: "View manifest",
  },
  {
    id: "n-002",
    title: "Compliance doc expiring",
    body: "GST certificate for Goyal Metals expires in 5 days. Upload the renewed copy to avoid delays.",
    timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    category: "compliance",
    severity: "warning",
    status: "unread",
    actor: "Compliance Bot",
    tags: ["Compliance", "GST"],
    actionLabel: "Upload now",
  },
  {
    id: "n-003",
    title: "Quality check failed",
    body: "Batch #204 failed torque test at station A3. Review deviation notes and re-run inspection.",
    timestamp: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
    category: "product",
    severity: "critical",
    status: "read",
    actor: "QA Station A3",
    tags: ["QA", "Batch #204"],
    actionLabel: "View report",
  },
  {
    id: "n-004",
    title: "Invoice ready",
    body: "Invoice INV-7781 generated for order #1189. Amount: ₹6,40,000. Due in 7 days.",
    timestamp: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
    category: "billing",
    severity: "info",
    status: "read",
    actor: "Billing",
    tags: ["Invoice", "Order #1189"],
    actionLabel: "Download PDF",
  },
  {
    id: "n-005",
    title: "System maintenance window",
    body: "Planned downtime on Saturday, 22:00–23:00 IST. Live tracking will be paused.",
    timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: "system",
    severity: "info",
    status: "read",
    actor: "Platform",
    tags: ["System", "Maintenance"],
  },
  {
    id: "n-006",
    title: "Supplier approved",
    body: "Prima Exports passed verification and is now eligible for private RFQs.",
    timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    category: "compliance",
    severity: "success",
    status: "read",
    actor: "VendorOps",
    tags: ["Suppliers", "RFQ"],
  },
];

export const countUnread = (items: NotificationItem[] = mockNotifications) => items.filter((item) => item.status === "unread").length;
