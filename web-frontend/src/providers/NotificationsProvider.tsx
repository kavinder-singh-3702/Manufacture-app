"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { getSocket } from "../lib/realtime";
import {
  notificationService,
  Notification,
  NotificationListParams,
} from "../services/notification";

/**
 * Web's counterpart to app-frontend/src/providers/NotificationsProvider.tsx —
 * same public API (notifications, unreadCount, refresh, loadMore, mark-read,
 * archive, acknowledge) plus server-side `filters`, so DashboardNotifications
 * can push status/priority/search to the API instead of filtering a single
 * loaded page client-side. Also the single source of truth for the unread
 * badge — previously UserDashboard.tsx and DashboardNotifications.tsx each
 * fetched their own independent unread count, so marking everything read on
 * the notifications page didn't update the topbar bell until the next
 * navigation re-fetch.
 */

type NotificationsContextType = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  pagination: { total: number; limit: number; offset: number };
  filters: NotificationListParams;
  setFilters: (filters: NotificationListParams) => void;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveById: (notificationId: string) => Promise<void>;
  unarchiveById: (notificationId: string) => Promise<void>;
  acknowledgeById: (notificationId: string) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
};

const PAGE_SIZE = 20;

const mergeUnique = (existing: Notification[], incoming: Notification[]) => {
  const map = new Map<string, Notification>();
  [...existing, ...incoming].forEach((item) => map.set(item.id, item));
  return Array.from(map.values()).sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
};

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user?.id);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0 });
  const [filters, setFilters] = useState<NotificationListParams>({});

  // Held in a ref (not state) so `loadNotifications`'s identity doesn't churn
  // on every page load — an offset-in-deps version was the exact bug fixed
  // on the app side (loadMore racing a stale closure, effects resubscribing
  // every page). See app-frontend/src/providers/NotificationsProvider.tsx.
  const offsetRef = useRef(0);

  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      setUnreadCount(await notificationService.getUnreadCount());
    } catch {
      // Non-fatal — the badge just won't update this refresh.
    }
  }, [isAuthenticated]);

  const loadNotifications = useCallback(
    async (resetOffset: boolean) => {
      if (!isAuthenticated) {
        setNotifications([]);
        setHasMore(false);
        return;
      }

      if (resetOffset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const offset = resetOffset ? 0 : offsetRef.current;
        const response = await notificationService.list({ ...filters, limit: PAGE_SIZE, offset });
        const items = response.notifications || [];

        setNotifications((previous) => (resetOffset ? items : mergeUnique(previous, items)));
        offsetRef.current = offset + items.length;
        setPagination({
          total: response.pagination?.total ?? 0,
          limit: response.pagination?.limit ?? PAGE_SIZE,
          offset,
        });
        setHasMore(Boolean(response.pagination?.hasMore));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load notifications");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [isAuthenticated, filters]
  );

  const refresh = useCallback(async () => {
    await Promise.all([loadNotifications(true), loadUnreadCount()]);
  }, [loadNotifications, loadUnreadCount]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loading || !hasMore) return;
    await loadNotifications(false);
  }, [loadingMore, loading, hasMore, loadNotifications]);

  const patchItem = useCallback((id: string, patch: Partial<Notification>) => {
    setNotifications((previous) => previous.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      patchItem(notificationId, { status: "read", readAt: new Date().toISOString() });
      setUnreadCount((previous) => Math.max(0, previous - 1));
      try {
        const updated = await notificationService.markAsRead(notificationId);
        patchItem(notificationId, updated);
      } catch {
        await refresh();
      }
    },
    [patchItem, refresh]
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications((previous) => previous.map((item) => ({ ...item, status: "read", readAt: item.readAt || new Date().toISOString() })));
    setUnreadCount(0);
    try {
      await notificationService.markAllAsRead();
    } catch {
      await refresh();
    }
  }, [refresh]);

  const archiveById = useCallback(
    async (notificationId: string) => {
      const wasUnread = notifications.find((item) => item.id === notificationId)?.status === "unread";
      setNotifications((previous) => previous.filter((item) => item.id !== notificationId));
      if (wasUnread) setUnreadCount((previous) => Math.max(0, previous - 1));
      try {
        await notificationService.archive(notificationId);
      } catch {
        await refresh();
      }
    },
    [notifications, refresh]
  );

  const unarchiveById = useCallback(
    async (notificationId: string) => {
      try {
        const updated = await notificationService.unarchive(notificationId);
        setNotifications((previous) => previous.filter((item) => item.id !== notificationId).concat(updated));
      } catch {
        await refresh();
      }
    },
    [refresh]
  );

  const acknowledgeById = useCallback(
    async (notificationId: string) => {
      try {
        const updated = await notificationService.acknowledge(notificationId);
        patchItem(notificationId, updated);
      } catch {
        await refresh();
      }
    },
    [patchItem, refresh]
  );

  useEffect(() => {
    if (isAuthenticated) {
      void refresh();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(false);
      offsetRef.current = 0;
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, filters]);

  // Realtime — the backend emits `notification:new` on immediate in-app
  // delivery (backend/src/services/notification.service.js
  // `emitNotificationsBulk`). Previously web had no socket client at all, so
  // this event only ever reached the mobile app; the web inbox and topbar
  // bell only updated on navigation/manual refresh.
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let isMounted = true;
    let cleanup: (() => void) | null = null;

    const handleNew = (payload: unknown) => {
      if (!isMounted) return;
      const notification = payload as Notification;
      setNotifications((previous) => (offsetRef.current > previous.length ? previous : mergeUnique([notification], previous)));
      setUnreadCount((previous) => previous + 1);
      setPagination((previous) => ({ ...previous, total: previous.total + 1 }));
    };

    (async () => {
      try {
        const socket = await getSocket();
        if (!isMounted) return;
        socket.on("notification:new", handleNew);
        cleanup = () => socket.off("notification:new", handleNew);
      } catch (err) {
        console.warn("[NotificationsProvider] Socket connection failed", err);
      }
    })();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      loadingMore,
      error,
      hasMore,
      pagination,
      filters,
      setFilters,
      refresh,
      loadMore,
      markAsRead,
      markAllAsRead,
      archiveById,
      unarchiveById,
      acknowledgeById,
    }),
    [
      notifications,
      unreadCount,
      loading,
      loadingMore,
      error,
      hasMore,
      pagination,
      filters,
      refresh,
      loadMore,
      markAsRead,
      markAllAsRead,
      archiveById,
      unarchiveById,
      acknowledgeById,
    ]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};
