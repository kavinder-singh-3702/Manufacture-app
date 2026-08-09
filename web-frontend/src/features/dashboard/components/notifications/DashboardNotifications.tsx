"use client";

import { useEffect, useMemo, useState } from "react";
import { useNotifications } from "@/src/providers/NotificationsProvider";
import { NotificationPriority } from "@/src/services/notification";
import { PageHeader, Stat } from "@/src/components/ui/Surface";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonListItem } from "@/src/components/ui/Skeleton";
import { toNotificationItem } from "./data";
import { NotificationFilters, type ViewMode } from "./NotificationFilters";
import { NotificationCard } from "./NotificationCard";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Reads from the shared NotificationsProvider (app/providers.tsx) instead of
 * fetching its own page of results — filters (view mode / priority / search)
 * are pushed to the server via `setFilters` rather than applied client-side
 * over one loaded page, and the unread count / realtime updates are shared
 * with the topbar bell in UserDashboard.tsx.
 */
export const DashboardNotifications = () => {
  const {
    notifications,
    unreadCount,
    loading,
    loadingMore,
    error,
    hasMore,
    pagination,
    setFilters,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
    archiveById,
    unarchiveById,
    acknowledgeById,
  } = useNotifications();

  const [viewMode, setViewMode] = useState<ViewMode>("unread");
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | "all">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    setFilters({
      status: viewMode === "unread" ? "unread" : undefined,
      archived: viewMode === "archived",
      priority: priorityFilter === "all" ? undefined : priorityFilter,
      search: debouncedSearch || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, priorityFilter, debouncedSearch]);

  const items = useMemo(() => notifications.map(toNotificationItem), [notifications]);

  const grouped = useMemo(() => {
    const byDay = items.reduce<Record<string, typeof items>>((acc, item) => {
      const dateKey = new Date(item.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    }, {});
    return Object.entries(byDay).map(([label, groupItems]) => ({ label, items: groupItems }));
  }, [items]);

  const handleRefresh = () => void refresh();

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
              onClick={() => void markAllAsRead()}
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
        <Stat label="Total matching" value={pagination.total} />
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
                      onMarkRead={(id) => void markAsRead(id)}
                      onArchive={(id) => void archiveById(id)}
                      onUnarchive={(id) => void unarchiveById(id)}
                      onAcknowledge={(id) => void acknowledgeById(id)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {hasMore && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => void loadMore()}
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
