"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { countUnread, mockNotifications, NotificationItem, NotificationCategory } from "./data";

type FilterState = {
  category: NotificationCategory | "all";
  unreadOnly: boolean;
};

const severityStyles = {
  info: { badge: "bg-[#eef2ff] text-[#4338ca]", dot: "bg-[#4338ca]" },
  warning: { badge: "bg-[#fff4e5] text-[#b45309]", dot: "bg-[#b45309]" },
  critical: { badge: "bg-[#ffeef1] text-[#b4234d]", dot: "bg-[#b4234d]" },
  success: { badge: "bg-[#ecfdf3] text-[#166534]", dot: "bg-[#166534]" },
} as const;

const categoryLabels: Record<NotificationCategory, string> = {
  orders: "Orders",
  compliance: "Compliance",
  system: "System",
  billing: "Billing",
  product: "Product",
};

const formatRelativeTime = (iso: string) => {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return "";
  const deltaMs = Date.now() - timestamp;
  const seconds = Math.round(deltaMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

export const DashboardNotifications = () => {
  const [items, setItems] = useState<NotificationItem[]>(mockNotifications);
  const [filter, setFilter] = useState<FilterState>({ category: "all", unreadOnly: false });

  const unreadCount = useMemo(() => countUnread(items), [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = filter.category === "all" || item.category === filter.category;
      const matchesUnread = !filter.unreadOnly || item.status === "unread";
      return matchesCategory && matchesUnread;
    });
  }, [filter, items]);

  const grouped = useMemo(() => {
    const byDay = filtered.reduce<Record<string, NotificationItem[]>>((acc, item) => {
      const dateKey = new Date(item.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    }, {});
    return Object.entries(byDay).map(([label, groupItems]) => ({ label, items: groupItems }));
  }, [filtered]);

  const markAllRead = () => setItems((prev) => prev.map((item) => ({ ...item, status: "read" })));
  const markItemRead = (id: string) =>
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "read",
            }
          : item
      )
    );

  return (
    <div className="space-y-6">
      <Header unreadCount={unreadCount} onMarkAllRead={markAllRead} />
      <SummaryRow items={items} />
      <FilterBar filter={filter} onChange={setFilter} />
      <div className="space-y-4">
        {grouped.length ? (
          grouped.map((group) => (
            <div key={group.label} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>
                {group.label}
              </p>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <NotificationCard key={item.id} item={item} onMarkRead={markItemRead} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
};

const Header = ({ unreadCount, onMarkAllRead }: { unreadCount: number; onMarkAllRead: () => void }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>
        Notifications
      </p>
      <h2 className="text-2xl font-semibold text-[var(--foreground)]">Inbox & alerts</h2>
      <p className="text-sm text-[var(--foreground)]">Workspace updates, orders, and compliance nudges.</p>
    </div>
    <div className="flex items-center gap-2">
      <span className="rounded-full bg-[#ffeef1] px-4 py-2 text-xs font-semibold text-[#b4234d]">
        {unreadCount} unread
      </span>
      <button
        type="button"
        onClick={onMarkAllRead}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--primary-dark)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <span aria-hidden="true">✓</span> Mark all read
      </button>
    </div>
  </div>
);

const SummaryRow = ({ items }: { items: NotificationItem[] }) => {
  const unread = items.filter((item) => item.status === "unread");
  const critical = items.filter((item) => item.severity === "critical");
  const compliance = items.filter((item) => item.category === "compliance");
  const billing = items.filter((item) => item.category === "billing");

  const cards = [
    { label: "Unread", value: unread.length, hint: "new updates", tone: "primary" as const },
    { label: "Critical", value: critical.length, hint: "needs attention", tone: "danger" as const },
    { label: "Compliance", value: compliance.length, hint: "docs & checks", tone: "muted" as const },
    { label: "Billing", value: billing.length, hint: "payments & invoices", tone: "muted" as const },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <motion.div
          key={card.label}
          className="rounded-3xl border border-[var(--border)] bg-white/85 p-4 shadow-sm shadow-[rgba(20,141,178,0.06)]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-sm font-semibold text-[var(--foreground)]">{card.label}</p>
          <div className="mt-1 flex items-end justify-between">
            <p className="text-2xl font-bold text-[var(--foreground)]">{card.value}</p>
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                card.tone === "primary"
                  ? "bg-[var(--primary-light)] text-[var(--primary)]"
                  : card.tone === "danger"
                  ? "bg-[#ffeef1] text-[#b4234d]"
                  : "bg-[var(--background)] text-[var(--primary-dark)]"
              }`}
            >
              {card.hint}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const FilterBar = ({ filter, onChange }: { filter: FilterState; onChange: (next: FilterState) => void }) => {
  const categories: (NotificationCategory | "all")[] = ["all", "orders", "compliance", "product", "billing", "system"];
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-[var(--border)] bg-white/70 p-3 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const isActive = filter.category === category;
          return (
            <button
              key={category}
              onClick={() => onChange({ ...filter, category })}
              className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize transition ${
                isActive
                  ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)] shadow-sm"
                  : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--primary)]"
              }`}
            >
              {category === "all" ? "All" : categoryLabels[category]}
            </button>
          );
        })}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)]">
          <input
            type="checkbox"
            checked={filter.unreadOnly}
            onChange={(event) => onChange({ ...filter, unreadOnly: event.target.checked })}
            className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
          />
          Unread only
        </label>
      </div>
    </div>
  );
};

const NotificationCard = ({ item, onMarkRead }: { item: NotificationItem; onMarkRead: (id: string) => void }) => {
  const severityStyle = severityStyles[item.severity];
  const isUnread = item.status === "unread";
  return (
    <motion.div
      layout
      initial={{ opacity: 0.8, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-3xl border bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
        isUnread ? "border-[var(--primary)]" : "border-[var(--border)]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`mt-1 h-2.5 w-2.5 rounded-full ${severityStyle.dot}`} aria-hidden />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--foreground)]">
                {categoryLabels[item.category]}
              </p>
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${severityStyle.badge}`}>
                {item.severity}
              </span>
              {isUnread ? (
                <span className="rounded-full bg-[#ffeef1] px-3 py-1 text-[11px] font-semibold text-[#b4234d]">New</span>
              ) : null}
            </div>
            <p className="text-lg font-semibold text-[var(--foreground)]">{item.title}</p>
            <p className="text-sm text-[var(--foreground)]">{item.body}</p>
            <div className="flex flex-wrap items-center gap-2">
              {item.actor ? <Badge label={item.actor} tone="muted" /> : null}
              {item.tags?.map((tag) => <Badge key={`${item.id}-${tag}`} label={tag} tone="outline" />)}
            </div>
            <p className="text-xs text-[#9a7a8b]">{formatRelativeTime(item.timestamp)}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {item.actionLabel ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)] bg-[var(--primary-light)] px-3 py-2 text-xs font-semibold text-[var(--primary)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {item.actionLabel} →
            </button>
          ) : null}
          {isUnread ? (
            <button
              type="button"
              onClick={() => onMarkRead(item.id)}
              className="text-xs font-semibold text-[var(--primary-dark)] underline decoration-[var(--primary)] underline-offset-4"
            >
              Mark read
            </button>
          ) : (
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a7a8b]">Archived</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Badge = ({ label, tone }: { label: string; tone?: "muted" | "outline" }) => {
  const classes =
    tone === "outline"
      ? "border border-[var(--border)] bg-white text-[var(--foreground)]"
      : "bg-[var(--background)] text-[var(--primary-dark)]";
  return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${classes}`}>{label}</span>;
};

const EmptyState = () => (
  <div className="rounded-3xl border border-dashed border-[var(--border)] bg-white/80 px-6 py-8 text-center">
    <p className="text-base font-semibold text-[var(--foreground)]">All caught up</p>
    <p className="mt-1 text-sm text-[var(--foreground)]">
      No notifications match your filter. We will surface new workspace updates here.
    </p>
  </div>
);
