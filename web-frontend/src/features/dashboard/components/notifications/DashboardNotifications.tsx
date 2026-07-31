"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { notificationService, NotificationPriority } from "@/src/services/notification";
import { ApiError } from "@/src/lib/api-error";
import { PageHeader, Stat } from "@/src/components/ui/Surface";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonListItem } from "@/src/components/ui/Skeleton";
import { toNotificationItem, NotificationItem } from "./data";
import { NotificationFilters, type ViewMode } from "./NotificationFilters";
import { NotificationCard } from "./NotificationCard";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export const DashboardNotifications = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("unread");
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | "all">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [search]);

  const load = useCallback(
    async (offset: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else { setLoading(true); setError(null); }
      try {
        const res = await notificationService.list({
          status: viewMode === "unread" ? "unread" : undefined,
          archived: viewMode === "archived",
          priority: priorityFilter === "all" ? undefined : priorityFilter,
          search: debouncedSearch || undefined,
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
    [priorityFilter, viewMode, debouncedSearch]
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
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        title="Notifications"
        actions={
          <>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-semibold text-[var(--primary-dark)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
            >
              <span aria-hidden="true">↻</span> {loading ? "Loading…" : "Refresh"}
            </button>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-semibold text-[var(--primary-dark)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
            >
              <span aria-hidden="true">✓</span> Mark all read
            </button>
          </>
        }
      />

      <NotificationFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={search}
        onSearchChange={setSearch}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
      />

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Unread" value={unreadCount} />
        <Stat label="Visible" value={items.length} />
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--danger)", backgroundColor: "var(--danger-bg)", color: "var(--danger-strong)" }}>
          <span>{error}</span>
          <button type="button" onClick={handleRefresh} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonListItem key={i} />
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
          <EmptyState
            type={viewMode === "archived" ? "empty" : "success"}
            title={viewMode === "archived" ? "Nothing archived" : "All caught up"}
            description={
              viewMode === "archived"
                ? "Notifications you archive will show up here."
                : "No notifications match your filter. We will surface new workspace updates here."
            }
          />
        )}
      </div>
    </div>
  );
};
