import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { chatService } from "../services/chat.service";
import { getChatSocket, ChatMessageEvent, ChatReadEvent } from "../services/chatSocket";
import { AppRole } from "../constants/roles";

type UnreadMessagesContextType = {
  totalUnread: number;
  refresh: () => Promise<void>;
};

const UnreadMessagesContext = createContext<UnreadMessagesContextType | null>(null);

export const useUnreadMessages = () => {
  const context = useContext(UnreadMessagesContext);
  if (!context) {
    // Return default values if used outside provider (for non-admin users)
    return { totalUnread: 0, refresh: async () => {} };
  }
  return context;
};

type Props = {
  children: ReactNode;
};

export const UnreadMessagesProvider = ({ children }: Props) => {
  const [totalUnread, setTotalUnread] = useState(0);
  const { user } = useAuth();

  const isAdmin = user?.role === AppRole.ADMIN;

  const loadUnreadCount = useCallback(async () => {
    if (!isAdmin || !user?.id) {
      setTotalUnread(0);
      return;
    }
    try {
      const response = await chatService.listConversations();
      const total = response.conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setTotalUnread(total);
    } catch (err) {
      console.warn("[UnreadMessagesProvider] Failed to load unread count", err);
    }
  }, [isAdmin, user?.id]);

  // Initial load
  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!isAdmin || !user?.id) return;

    let isMounted = true;
    let socketCleanup: (() => void) | null = null;

    const handleMessage = (payload: ChatMessageEvent) => {
      if (!isMounted) return;
      // New message received - refresh count
      loadUnreadCount();
    };

    const handleRead = (payload: ChatReadEvent) => {
      if (!isMounted) return;
      // Messages were read - refresh count
      loadUnreadCount();
    };

    (async () => {
      try {
        const socket = await getChatSocket();
        if (!isMounted) return;
        socket.on("chat:message", handleMessage);
        socket.on("chat:read", handleRead);
        socketCleanup = () => {
          socket.off("chat:message", handleMessage);
          socket.off("chat:read", handleRead);
        };
      } catch (error: any) {
        console.warn("[UnreadMessagesProvider] Socket connection failed", error?.message);
      }
    })();

    return () => {
      isMounted = false;
      if (socketCleanup) socketCleanup();
    };
  }, [isAdmin, user?.id, loadUnreadCount]);

  return (
    <UnreadMessagesContext.Provider value={{ totalUnread, refresh: loadUnreadCount }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
