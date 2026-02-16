import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { notificationService, Notification } from "../services/notification.service";
import { getChatSocket } from "../services/chatSocket";
import { emitNotificationRefresh, subscribeNotificationRefresh } from "../services/notificationEvents";

type NotificationsContextType = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
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
      error: null,
      hasMore: false,
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
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

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
    async (resetOffset = true) => {
      if (!isAuthenticated) {
        setNotifications([]);
        setHasMore(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const currentOffset = resetOffset ? 0 : offset;
        const response = await notificationService.getNotifications({
          limit: PAGE_SIZE,
          offset: currentOffset,
          archived: false,
        });

        if (resetOffset) {
          setNotifications(response.notifications || []);
          setOffset(PAGE_SIZE);
        } else {
          setNotifications((previous) => mergeUnique(previous, response.notifications || []));
          setOffset(currentOffset + PAGE_SIZE);
        }

        setHasMore(Boolean(response.pagination?.hasMore));
      } catch (err: any) {
        setError(err?.message || "Failed to load notifications");
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, offset]
  );

  const refresh = useCallback(async () => {
    await Promise.all([loadNotifications(true), loadUnreadCount()]);
  }, [loadNotifications, loadUnreadCount]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    await loadNotifications(false);
  }, [loading, hasMore, loadNotifications]);

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
      setOffset(0);
      setError(null);
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

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
      error,
      hasMore,
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
      error,
      hasMore,
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
