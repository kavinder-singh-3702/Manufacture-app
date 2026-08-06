"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { isAdminRole } from "../lib/roles";
import { getSocket } from "../lib/realtime";
import { chatService } from "../services/chat";
import type { ChatConversation, ChatMessage } from "../types/chat";

/**
 * Web's chat realtime + conversation-list layer — previously web chat polled
 * the open thread every 5s and never refreshed the conversation list at all
 * after mount (X6). This is the socket-driven replacement, structurally
 * mirroring app-frontend's UnreadMessagesProvider (totals) plus the
 * chat:message/chat:read handling app-frontend/src/screens/chat/
 * ChatScreen.tsx does per-thread — centralized here since web's list and
 * thread panes are visible side by side, not separate screens.
 *
 * Per-thread message state (the actual bubbles) stays local to the thread
 * component — this provider owns only the conversation list, unread totals,
 * and the shared socket subscription.
 */

type ChatMessageEvent = { conversationId: string; message: ChatMessage; conversation?: ChatConversation | null };
type ChatReadEvent = { conversationId: string; conversation?: ChatConversation | null; readerId?: string };
type ChatTypingEvent = { conversationId: string; userId: string; isTyping: boolean };

type MessageListener = (event: ChatMessageEvent) => void;
type ReadListener = (event: ChatReadEvent) => void;

type ChatContextType = {
  conversations: ChatConversation[];
  totalUnread: number;
  supportUnread: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  /** True while the OTHER participant of `conversationId` is typing. */
  isTyping: (conversationId: string) => boolean;
  sendTyping: (conversationId: string, typing: boolean) => void;
  /** Subscribe to raw chat:message events (e.g. an open thread appending live). */
  onMessage: (listener: MessageListener) => () => void;
  /** Subscribe to raw chat:read events (e.g. an open thread flipping checkmarks). */
  onRead: (listener: ReadListener) => () => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
};

const PAGE_SIZE = 30;

const mergeUnique = (existing: ChatConversation[], incoming: ChatConversation[]) => {
  const map = new Map<string, ChatConversation>();
  [...existing, ...incoming].forEach((item) => map.set(item.id, item));
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user?.id);

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingByConversation, setTypingByConversation] = useState<Record<string, boolean>>({});

  const offsetRef = useRef(0);
  const messageListenersRef = useRef(new Set<MessageListener>());
  const readListenersRef = useRef(new Set<ReadListener>());

  const supportUnread = useMemo(
    () =>
      conversations.reduce((sum, conv) => {
        return isAdminRole(conv.otherParticipant?.role) ? sum + (conv.unreadCount || 0) : sum;
      }, 0),
    [conversations]
  );

  const loadTotalUnread = useCallback(async () => {
    if (!isAuthenticated) {
      setTotalUnread(0);
      return;
    }
    try {
      setTotalUnread(await chatService.getUnreadCount());
    } catch {
      // Non-fatal — badge just won't update this refresh.
    }
  }, [isAuthenticated]);

  const loadConversations = useCallback(
    async (resetOffset: boolean) => {
      if (!isAuthenticated) {
        setConversations([]);
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
        const res = await chatService.listConversations({ limit: PAGE_SIZE, offset });
        const items = res.conversations ?? [];
        setConversations((prev) => (resetOffset ? items : mergeUnique(prev, items)));
        offsetRef.current = offset + items.length;
        setHasMore(Boolean(res.pagination?.hasMore));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load conversations");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [isAuthenticated]
  );

  const refresh = useCallback(async () => {
    await Promise.all([loadConversations(true), loadTotalUnread()]);
  }, [loadConversations, loadTotalUnread]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    await loadConversations(false);
  }, [loading, loadingMore, hasMore, loadConversations]);

  const upsertConversation = useCallback((summary: ChatConversation | null | undefined) => {
    if (!summary) return;
    setConversations((prev) => mergeUnique(prev, [summary]));
  }, []);

  const isTyping = useCallback((conversationId: string) => Boolean(typingByConversation[conversationId]), [typingByConversation]);

  const sendTyping = useCallback(async (conversationId: string, typing: boolean) => {
    try {
      const socket = await getSocket();
      socket.emit("chat:typing", { conversationId, isTyping: typing });
    } catch {
      // best effort — typing indicator is non-critical
    }
  }, []);

  const onMessage = useCallback((listener: MessageListener) => {
    messageListenersRef.current.add(listener);
    return () => messageListenersRef.current.delete(listener);
  }, []);

  const onRead = useCallback((listener: ReadListener) => {
    readListenersRef.current.add(listener);
    return () => readListenersRef.current.delete(listener);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void refresh();
    } else {
      setConversations([]);
      setTotalUnread(0);
      setHasMore(false);
      offsetRef.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let isMounted = true;
    let cleanup: (() => void) | null = null;
    // Scoped to this effect run (not a ref) — every timer it holds is set
    // and cleared entirely within this effect's own handlers/cleanup, so
    // there's no cross-render mutable state to reason about here.
    const typingClearTimers = new Map<string, ReturnType<typeof setTimeout>>();

    const handleMessage = (payload: ChatMessageEvent) => {
      if (!isMounted) return;
      upsertConversation(payload.conversation);
      if (payload.message.senderId !== user?.id) {
        setTotalUnread((prev) => prev + 1);
      }
      messageListenersRef.current.forEach((listener) => listener(payload));
    };

    const handleRead = (payload: ChatReadEvent) => {
      if (!isMounted) return;
      upsertConversation(payload.conversation);
      void loadTotalUnread();
      readListenersRef.current.forEach((listener) => listener(payload));
    };

    const handleTyping = (payload: ChatTypingEvent) => {
      if (!isMounted || payload.userId === user?.id) return;
      setTypingByConversation((prev) => ({ ...prev, [payload.conversationId]: payload.isTyping }));

      const existing = typingClearTimers.get(payload.conversationId);
      if (existing) clearTimeout(existing);
      if (payload.isTyping) {
        typingClearTimers.set(
          payload.conversationId,
          setTimeout(() => {
            setTypingByConversation((prev) => ({ ...prev, [payload.conversationId]: false }));
          }, 4000)
        );
      }
    };

    (async () => {
      try {
        const socket = await getSocket();
        if (!isMounted) return;
        socket.on("chat:message", handleMessage);
        socket.on("chat:read", handleRead);
        socket.on("chat:typing", handleTyping);
        cleanup = () => {
          socket.off("chat:message", handleMessage);
          socket.off("chat:read", handleRead);
          socket.off("chat:typing", handleTyping);
        };
      } catch (err) {
        console.warn("[ChatProvider] Socket connection failed", err);
      }
    })();

    return () => {
      isMounted = false;
      cleanup?.();
      typingClearTimers.forEach((timer) => clearTimeout(timer));
      typingClearTimers.clear();
    };
  }, [isAuthenticated, user?.id, upsertConversation, loadTotalUnread]);

  const value = useMemo(
    () => ({
      conversations,
      totalUnread,
      supportUnread,
      loading,
      loadingMore,
      hasMore,
      error,
      refresh,
      loadMore,
      isTyping,
      sendTyping,
      onMessage,
      onRead,
    }),
    [conversations, totalUnread, supportUnread, loading, loadingMore, hasMore, error, refresh, loadMore, isTyping, sendTyping, onMessage, onRead]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
