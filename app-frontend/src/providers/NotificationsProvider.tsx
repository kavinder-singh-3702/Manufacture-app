import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { notificationService, Notification } from "../services/notification.service";
import { getChatSocket } from "../services/chatSocket";

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
    };
  }
  return context;
};

type Props = {
  children: ReactNode;
};

const PAGE_SIZE = 20;

export const NotificationsProvider = ({ children }: Props) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const { user } = useAuth();
  const isAuthenticated = Boolean(user?.id);

  // Load unread count
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

  // Load notifications
  const loadNotifications = useCallback(async (resetOffset = true) => {
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
      });

      if (resetOffset) {
        setNotifications(response.notifications);
        setOffset(PAGE_SIZE);
      } else {
        setNotifications((prev) => [...prev, ...response.notifications]);
        setOffset(currentOffset + PAGE_SIZE);
      }

      setHasMore(response.pagination.hasMore);
    } catch (err: any) {
      console.error("[NotificationsProvider] Failed to load notifications", err);
      setError(err?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, offset]);

  // Refresh - reload from the beginning
  const refresh = useCallback(async () => {
    await Promise.all([loadNotifications(true), loadUnreadCount()]);
  }, [loadNotifications, loadUnreadCount]);

  // Load more - pagination
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    await loadNotifications(false);
  }, [loading, hasMore, loadNotifications]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, status: "read" as const, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("[NotificationsProvider] Failed to mark as read", err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: "read" as const, readAt: n.readAt || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("[NotificationsProvider] Failed to mark all as read", err);
    }
  }, []);

  // Initial load when user changes
  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(false);
      setOffset(0);
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Socket listener for real-time notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    let socketCleanup: (() => void) | null = null;

    const handleNewNotification = (notification: Notification) => {
      if (!isMounted) return;
      console.log("[NotificationsProvider] New notification received:", notification.title);
      // Add to the top of the list
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    (async () => {
      try {
        const socket = await getChatSocket();
        if (!isMounted) return;

        // Listen for new notifications
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

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        hasMore,
        refresh,
        loadMore,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
