"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { notificationService, NotificationPriority } from "@/src/services/notification";
import { ApiError } from "@/src/lib/api-error";
import { toNotificationItem, NotificationItem } from "./data";

type ViewMode = "unread" | "all" | "archived";

const PAGE_SIZE = 20;

const severityStyles = {
  info:     { badge: "bg-[#eef2ff] text-[#4338ca]", dot: "bg-[#4338ca]" },
  warning:  { badge: "bg-[#fff4e5] text-[#b45309]", dot: "bg-[#b45309]" },
  critical: { badge: "bg-[#ffeef1] text-[#b4234d]", dot: "bg-[#b4234d]" },
} as const;

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
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("unread");
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | "all">("all");
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(
    async (offset: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else { setLoading(true); setError(null); }
      try {
        const res = await notificationService.list({
          status: viewMode === "unread" ? "unread" : undefined,
          archived: viewMode === "archived",
          priority: priorityFilter === "all" ? undefined : priorityFilter,
          limit: PAGE_SIZE,
          offset,
        });
        const mapped = res.notifications.map(toNotificationItem);
        setItems((prev) => (append ? [...prev, ...mapped] : mapped));
        setPagination(res.pagination);
      } catch (err) {
        setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load notifications");
      } finally {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [priorityFilter, viewMode]
  );

  const loadUnreadCount = useCallback(async () => {
    try {
      setUnreadCount(await notificationService.getUnreadCount());
    } catch {
      // Non-fatal — the header just won't show a live count this refresh.
    }
  }, []);

  useEffect(() => { load(0, false); }, [load]);
  useEffect(() => { loadUnreadCount(); }, [loadUnreadCount]);

  const handleRefresh = () => { load(0, false); loadUnreadCount(); };
  const handleLoadMore = () => {
    if (loadingMore || !pagination.hasMore) return;
    load(pagination.offset + pagination.limit, true);
  };

  const patchItem = (id: string, patch: Partial<NotificationItem>) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const markItemRead = async (id: string) => {
    patchItem(id, { status: "read" });
    setUnreadCount((c) => Math.max(0, c - 1));
    try { await notificationService.markAsRead(id); } catch { load(0, false); }
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((item) => ({ ...item, status: "read" })));
    setUnreadCount(0);
    try { await notificationService.markAllAsRead(); } catch { load(0, false); }
  };

  const archiveItem = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    try { await notificationService.archive(id); } catch { load(0, false); }
  };

  const unarchiveItem = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    try { await notificationService.unarchive(id); } catch { load(0, false); }
  };

  const acknowledgeItem = async (id: string) => {
    patchItem(id, { ackAt: new Date().toISOString() });
    try { await notificationService.acknowledge(id); } catch { load(0, false); }
  };

  const grouped = useMemo(() => {
    const byDay = items.reduce<Record<string, NotificationItem[]>>((acc, item) => {
      const dateKey = new Date(item.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    }, {});
    return Object.entries(byDay).map(([label, groupItems]) => ({ label, items: groupItems }));
  }, [items]);

  return (
    <div className="space-y-6">
      <Header unreadCount={unreadCount} onMarkAllRead={markAllRead} onRefresh={handleRefresh} refreshing={loading} />
      <ViewModeBar viewMode={viewMode} onChange={setViewMode} priorityFilter={priorityFilter} onPriorityChange={setPriorityFilter} />

      {error && (
        <div className="flex items-center justify-between rounded-3xl border border-[#f5d0dc] bg-[#fff1f4] px-4 py-3 text-sm text-[#7a3a4a]">
          <span>{error}</span>
          <button type="button" onClick={handleRefresh} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 h-24" />
            ))}
          </div>
        ) : grouped.length ? (
          <>
            {grouped.map((group) => (
              <div key={group.label} className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>
                  {group.label}
                </p>
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <NotificationCard
                      key={item.id}
                      item={item}
                      archived={viewMode === "archived"}
                      onMarkRead={markItemRead}
                      onArchive={archiveItem}
                      onUnarchive={unarchiveItem}
                      onAcknowledge={acknowledgeItem}
                    />
                  ))}
                </div>
              </div>
            ))}
            {pagination.hasMore && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="rounded-full border border-[var(--border)] bg-[var(--card)] px-5 py-2 text-xs font-semibold text-[var(--primary-dark)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState viewMode={viewMode} />
        )}
      </div>
    </div>
  );
};

const Header = ({
  unreadCount, onMarkAllRead, onRefresh, refreshing,
}: {
  unreadCount: number;
  onMarkAllRead: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>Notifications</p>
      <h2 className="text-2xl font-semibold text-[var(--foreground)]">Inbox & alerts</h2>
      <p className="text-sm text-[var(--foreground)]">Workspace updates, orders, and compliance nudges.</p>
    </div>
    <div className="flex items-center gap-2">
      <span className="rounded-full bg-[#ffeef1] px-4 py-2 text-xs font-semibold text-[#b4234d]">
        {unreadCount} unread
      </span>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-semibold text-[var(--primary-dark)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
      >
        <span aria-hidden="true">↻</span> {refreshing ? "Loading…" : "Refresh"}
      </button>
      <button
        type="button"
        onClick={onMarkAllRead}
        disabled={unreadCount === 0}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-semibold text-[var(--primary-dark)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
      >
        <span aria-hidden="true">✓</span> Mark all read
      </button>
    </div>
  </div>
);

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: "unread", label: "Unread" },
  { key: "all", label: "All" },
  { key: "archived", label: "Archived" },
];

const PRIORITY_FILTERS: { key: NotificationPriority | "all"; label: string }[] = [
  { key: "all", label: "All priorities" },
  { key: "low", label: "Low" },
  { key: "normal", label: "Normal" },
  { key: "high", label: "High" },
  { key: "critical", label: "Critical" },
];

const ViewModeBar = ({
  viewMode, onChange, priorityFilter, onPriorityChange,
}: {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
  priorityFilter: NotificationPriority | "all";
  onPriorityChange: (priority: NotificationPriority | "all") => void;
}) => (
  <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm">
    <div className="flex flex-wrap gap-2">
      {VIEW_MODES.map(({ key, label }) => {
        const isActive = viewMode === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              isActive
                ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)] shadow-sm"
                : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--primary)]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
    <div className="ml-auto flex flex-wrap gap-2">
      {PRIORITY_FILTERS.map(({ key, label }) => {
        const isActive = priorityFilter === key;
        return (
          <button
            key={key}
            onClick={() => onPriorityChange(key)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              isActive
                ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)] shadow-sm"
                : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--primary)]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  </div>
);

const NotificationCard = ({
  item, archived, onMarkRead, onArchive, onUnarchive, onAcknowledge,
}: {
  item: NotificationItem;
  archived: boolean;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onAcknowledge: (id: string) => void;
}) => {
  const severityStyle = severityStyles[item.severity];
  const isUnread = item.status === "unread";
  return (
    <motion.div
      layout
      initial={{ opacity: 0.8, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-3xl border bg-[var(--card)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
        isUnread ? "border-[var(--primary)]" : "border-[var(--border)]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${severityStyle.dot}`} aria-hidden />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--foreground)]">
                {item.topic}
              </p>
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${severityStyle.badge}`}>
                {item.priority}
              </span>
              {isUnread && (
                <span className="rounded-full bg-[#ffeef1] px-3 py-1 text-[11px] font-semibold text-[#b4234d]">New</span>
              )}
            </div>
            <p className="text-base font-semibold text-[var(--foreground)]">{item.title}</p>
            {item.body && <p className="text-sm text-[var(--foreground)]">{item.body}</p>}
            <p className="text-xs text-[#9a7a8b]">{formatRelativeTime(item.timestamp)}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {item.requiresAck && !item.ackAt && (
            <button
              type="button"
              onClick={() => onAcknowledge(item.id)}
              className="text-xs font-semibold text-[var(--primary-dark)] underline decoration-[var(--primary)] underline-offset-4"
            >
              Acknowledge
            </button>
          )}
          {archived ? (
            <button
              type="button"
              onClick={() => onUnarchive(item.id)}
              className="text-xs font-semibold text-[var(--primary-dark)] underline decoration-[var(--primary)] underline-offset-4"
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onArchive(item.id)}
              className="text-xs font-semibold text-[#9a7a8b] underline decoration-[#9a7a8b] underline-offset-4"
            >
              Archive
            </button>
          )}
          {isUnread ? (
            <button
              type="button"
              onClick={() => onMarkRead(item.id)}
              className="text-xs font-semibold text-[var(--primary-dark)] underline decoration-[var(--primary)] underline-offset-4"
            >
              Mark read
            </button>
          ) : (
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a7a8b]">Read</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const EmptyState = ({ viewMode }: { viewMode: ViewMode }) => (
  <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card)] px-6 py-8 text-center">
    <p className="text-base font-semibold text-[var(--foreground)]">
      {viewMode === "archived" ? "Nothing archived" : "All caught up"}
    </p>
    <p className="mt-1 text-sm text-[var(--foreground)]">
      {viewMode === "archived"
        ? "Notifications you archive will show up here."
        : "No notifications match your filter. We will surface new workspace updates here."}
    </p>
  </div>
);
