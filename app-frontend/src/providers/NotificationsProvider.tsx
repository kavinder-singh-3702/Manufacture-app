import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { notificationService, Notification, NotificationListParams } from "../services/notification.service";
import { getChatSocket } from "../services/chatSocket";
import { emitNotificationRefresh, subscribeNotificationRefresh } from "../services/notificationEvents";

type NotificationsContextType = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
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
    return {
      notifications: [],
      unreadCount: 0,
      loading: false,
      loadingMore: false,
      error: null,
      hasMore: false,
      total: 0,
      filters: {} as NotificationListParams,
      setFilters: () => {},
      refresh: async () => {},
      loadMore: async () => {},
      markAsRead: async () => {},
      markAllAsRead: async () => {},
      archiveById: async () => {},
      unarchiveById: async () => {},
      acknowledgeById: async () => {},
    };
  }
  return context;
};

type Props = {
  children: ReactNode;
};

const PAGE_SIZE = 20;

const mergeUnique = (existing: Notification[], incoming: Notification[]) => {
  const map = new Map<string, Notification>();
  [...existing, ...incoming].forEach((item) => {
    map.set(item.id, item);
  });
  return Array.from(map.values()).sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
};

export const NotificationsProvider = ({ children }: Props) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<NotificationListParams>({});

  // Held in a ref, not state: `offset` was previously a state dependency of
  // `loadNotifications`, which meant `refresh`/`loadMore` got a new identity
  // every single page load. That churn cascaded into the
  // subscribeNotificationRefresh effect below (deps: [isAuthenticated,
  // refresh]) tearing down and resubscribing on every `loadMore` call, and
  // `setOffset(PAGE_SIZE)` on reset assumed a full page came back rather than
  // using the actual response length (A3).
  const offsetRef = useRef(0);

  const { user } = useAuth();
  const isAuthenticated = Boolean(user?.id);

  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.warn("[NotificationsProvider] Failed to load unread count", err);
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
        const currentOffset = resetOffset ? 0 : offsetRef.current;
        // `archived` used to be hardcoded `false` here — filters (status,
        // priority, search, archived) now come from the screen via
        // `setFilters` instead of being applied client-side over one loaded
        // page (A2).
        const response = await notificationService.getNotifications({
          ...filters,
          limit: PAGE_SIZE,
          offset: currentOffset,
        });
        const items = response.notifications || [];

        setNotifications((previous) => (resetOffset ? items : mergeUnique(previous, items)));
        offsetRef.current = currentOffset + items.length;
        setTotal(response.pagination?.total ?? 0);
        setHasMore(Boolean(response.pagination?.hasMore));
      } catch (err: any) {
        setError(err?.message || "Failed to load notifications");
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
    if (loading || loadingMore || !hasMore) return;
    await loadNotifications(false);
  }, [loading, loadingMore, hasMore, loadNotifications]);

  const updateLocalItem = useCallback((id: string, updater: (item: Notification) => Notification) => {
    setNotifications((previous) => previous.map((item) => (item.id === id ? updater(item) : item)));
  }, []);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const response = await notificationService.markAsRead(notificationId);
        updateLocalItem(notificationId, () => response.notification);
        setUnreadCount((previous) => Math.max(0, previous - 1));
      } catch (err) {
        console.error("[NotificationsProvider] Failed to mark as read", err);
      }
    },
    [updateLocalItem]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          status: "read",
          readAt: item.readAt || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("[NotificationsProvider] Failed to mark all as read", err);
    }
  }, []);

  const archiveById = useCallback(
    async (notificationId: string) => {
      try {
        await notificationService.archive(notificationId);
        setNotifications((previous) => previous.filter((item) => item.id !== notificationId));
        emitNotificationRefresh();
      } catch (err) {
        console.error("[NotificationsProvider] Failed to archive notification", err);
      }
    },
    []
  );

  const unarchiveById = useCallback(
    async (notificationId: string) => {
      try {
        const response = await notificationService.unarchive(notificationId);
        setNotifications((previous) => mergeUnique(previous, [response.notification]));
        emitNotificationRefresh();
      } catch (err) {
        console.error("[NotificationsProvider] Failed to unarchive notification", err);
      }
    },
    []
  );

  const acknowledgeById = useCallback(
    async (notificationId: string) => {
      try {
        const response = await notificationService.acknowledge(notificationId);
        updateLocalItem(notificationId, () => response.notification);
      } catch (err) {
        console.error("[NotificationsProvider] Failed to acknowledge notification", err);
      }
    },
    [updateLocalItem]
  );

  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(false);
      offsetRef.current = 0;
      setError(null);
    }
    // Refetches on `filters` too, now that the screen pushes status/priority/
    // search/archived server-side instead of filtering one loaded page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, filters]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    let socketCleanup: (() => void) | null = null;

    const handleNewNotification = (notification: Notification) => {
      if (!isMounted) return;
      setNotifications((previous) => mergeUnique([notification], previous));
      if (notification.status === "unread") {
        setUnreadCount((previous) => previous + 1);
      }
    };

    (async () => {
      try {
        const socket = await getChatSocket();
        if (!isMounted) return;

        socket.on("notification:new" as any, handleNewNotification);
        socketCleanup = () => {
          socket.off("notification:new" as any, handleNewNotification);
        };
      } catch (error: any) {
        console.warn("[NotificationsProvider] Socket connection failed", error?.message);
      }
    })();

    return () => {
      isMounted = false;
      if (socketCleanup) socketCleanup();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    return subscribeNotificationRefresh(() => {
      refresh();
    });
  }, [isAuthenticated, refresh]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      loadingMore,
      error,
      hasMore,
      total,
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
      total,
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
