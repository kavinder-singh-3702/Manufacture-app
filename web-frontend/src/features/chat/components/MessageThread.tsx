"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { chatService } from "@/src/services/chat";
import { useChat } from "@/src/providers/ChatProvider";
import { useToast } from "@/src/components/ui/Toast";
import type { ChatConversation, ChatMessage } from "@/src/types/chat";
import { MessageBubble } from "./MessageBubble";
import { Composer } from "./Composer";
import { ProductContextCard } from "./ProductContextCard";

const PAGE_SIZE = 40;

const getInitials = (name?: string | null) =>
  (name ?? "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const fmtDay = (iso: string) => {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = today.getTime() - msgDay.getTime();
  if (diff === 0) return "Today";
  if (diff === 86400000) return "Yesterday";
  if (diff < 7 * 86400000) return date.toLocaleDateString("en-US", { weekday: "long" });
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

// Consecutive bubbles from the same sender within this window group visually
// (no repeated tail/avatar) — mirrors common chat-app grouping.
const GROUP_WINDOW_MS = 3 * 60 * 1000;

export const MessageThread = ({
  conversation,
  currentUserId,
  onBack,
  initialProductId,
}: {
  conversation: ChatConversation;
  currentUserId: string;
  /** Omit (e.g. in the desktop-only admin console) to never render the back button. */
  onBack?: () => void;
  initialProductId?: string | null;
}) => {
  const toast = useToast();
  const { onMessage, onRead, isTyping, refresh: refreshConversations } = useChat();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [derivedProductId, setDerivedProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prependAnchor = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);
  const shouldStickToBottom = useRef(true);

  const effectiveProductId = initialProductId || derivedProductId;
  const typing = isTyping(conversation.id);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await chatService.getMessages(conversation.id, { limit: PAGE_SIZE, offset: 0 });
      const sorted = [...(res.messages ?? [])].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setMessages(sorted);
      setOffset(sorted.length);
      setHasMore(Boolean(res.pagination?.hasMore));

      const latestProductRef = [...sorted].reverse().find((m) => m.contextRef?.type === "product" && m.contextRef.refId);
      if (latestProductRef?.contextRef?.refId) setDerivedProductId(latestProductRef.contextRef.refId);

      shouldStickToBottom.current = true;
      await chatService.markRead(conversation.id);
      void refreshConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [conversation.id, refreshConversations]);

  useEffect(() => {
    setMessages([]);
    setDerivedProductId(null);
    setOffset(0);
    setHasMore(false);
    void loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  // Realtime — appends/flips read state for THIS open thread only.
  useEffect(() => {
    const offMessage = onMessage((payload) => {
      if (payload.conversationId !== conversation.id || payload.message.senderId === currentUserId) return;
      setMessages((prev) => (prev.some((m) => m.id === payload.message.id) ? prev : [...prev, payload.message]));
      if (payload.message.contextRef?.type === "product" && payload.message.contextRef.refId) {
        setDerivedProductId(payload.message.contextRef.refId);
      }
      shouldStickToBottom.current = true;
      chatService.markRead(conversation.id).then(() => refreshConversations()).catch(() => {});
    });
    const offRead = onRead((payload) => {
      if (payload.conversationId !== conversation.id || payload.readerId === currentUserId) return;
      setMessages((prev) => prev.map((m) => (m.senderId === currentUserId && !m.read ? { ...m, read: true } : m)));
    });
    return () => {
      offMessage();
      offRead();
    };
  }, [conversation.id, currentUserId, onMessage, onRead, refreshConversations]);

  // Scroll anchoring: stick to bottom on new/initial messages, but hold
  // position exactly when prepending older history via "Load earlier" (U6) —
  // previously the view jumped because nothing compensated for the inserted
  // height above the current scroll position.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (prependAnchor.current) {
      const { scrollHeight, scrollTop } = prependAnchor.current;
      el.scrollTop = el.scrollHeight - scrollHeight + scrollTop;
      prependAnchor.current = null;
      return;
    }
    if (shouldStickToBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: loading ? "auto" : "smooth" });
    }
  }, [messages, loading]);

  const loadEarlier = useCallback(async () => {
    if (!hasMore || loadingEarlier) return;
    const el = scrollRef.current;
    if (el) prependAnchor.current = { scrollHeight: el.scrollHeight, scrollTop: el.scrollTop };
    shouldStickToBottom.current = false;
    setLoadingEarlier(true);
    try {
      const res = await chatService.getMessages(conversation.id, { limit: PAGE_SIZE, offset });
      const older = [...(res.messages ?? [])].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setMessages((prev) => {
        const existing = new Set(prev.map((m) => m.id));
        return [...older.filter((m) => !existing.has(m.id)), ...prev];
      });
      setOffset((prev) => prev + older.length);
      setHasMore(Boolean(res.pagination?.hasMore));
    } catch {
      prependAnchor.current = null;
    } finally {
      setLoadingEarlier(false);
    }
  }, [conversation.id, hasMore, loadingEarlier, offset]);

  const handleSend = useCallback(
    async (text: string) => {
      const optimisticId = `opt-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: optimisticId,
        conversationId: conversation.id,
        senderId: currentUserId,
        senderRole: "user",
        content: text,
        timestamp: new Date().toISOString(),
        read: false,
      };
      shouldStickToBottom.current = true;
      setMessages((prev) => [...prev, optimistic]);
      try {
        const contextRef = effectiveProductId
          ? { type: "product", refId: effectiveProductId }
          : undefined;
        const res = await chatService.sendMessage(conversation.id, text, { contextRef });
        setMessages((prev) => prev.map((m) => (m.id === optimisticId ? res.message : m)));
        void refreshConversations();
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        toast.error("Message not sent", err instanceof Error ? err.message : undefined);
      }
    },
    [conversation.id, currentUserId, effectiveProductId, refreshConversations, toast]
  );

  const handleSendImage = useCallback(
    async (payload: { base64: string; fileName: string; mimeType: string }) => {
      const optimisticId = `opt-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: optimisticId,
        conversationId: conversation.id,
        senderId: currentUserId,
        senderRole: "user",
        content: "Sent a photo",
        attachments: [{ url: payload.base64, type: payload.mimeType, name: payload.fileName }],
        timestamp: new Date().toISOString(),
        read: false,
      };
      shouldStickToBottom.current = true;
      setMessages((prev) => [...prev, optimistic]);
      try {
        const res = await chatService.sendImage(conversation.id, payload);
        setMessages((prev) => prev.map((m) => (m.id === optimisticId ? res.message : m)));
        void refreshConversations();
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        toast.error("Photo not sent", err instanceof Error ? err.message : undefined);
      }
    },
    [conversation.id, currentUserId, refreshConversations, toast]
  );

  const grouped = useMemo(() => {
    return messages.map((message, idx) => {
      const previous = messages[idx - 1];
      const showDay = !previous || fmtDay(previous.timestamp) !== fmtDay(message.timestamp);
      const sameSenderAsPrevious =
        previous &&
        previous.senderId === message.senderId &&
        new Date(message.timestamp).getTime() - new Date(previous.timestamp).getTime() < GROUP_WINDOW_MS &&
        !showDay;
      return { message, showDay, showTail: !sameSenderAsPrevious };
    });
  }, [messages]);

  const name = conversation.otherParticipant?.name ?? "Support";
  const productContextRef = effectiveProductId
    ? { type: "product", refId: effectiveProductId, label: undefined, imageUrl: undefined }
    : messages.find((m) => m.contextRef?.type === "product")?.contextRef;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center gap-3 p-3" style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
        {onBack && (
          // lg:hidden — only meaningful in the mobile full-bleed layout,
          // which is the only caller that passes onBack; the desktop split
          // view (and the admin console) show both panes at once so there's
          // nothing to "go back" from.
          <button onClick={onBack} aria-label="Back to conversations" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-70 lg:hidden" style={{ backgroundColor: "var(--background)" }}>
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
          {getInitials(name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold" style={{ color: "var(--foreground)" }}>{name}</p>
          <p className="text-xs" style={{ color: typing ? "var(--primary)" : "var(--medium-gray)" }}>
            {typing ? "typing…" : conversation.otherParticipant?.phone || (effectiveProductId ? "Seller" : "Support")}
          </p>
        </div>
      </div>

      {productContextRef?.refId && <ProductContextCard contextRef={productContextRef} />}

      <div ref={scrollRef} className="flex-1 space-y-1 overflow-y-auto overscroll-contain px-4 py-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: "var(--primary)" }} />
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center pb-3">
                <button
                  onClick={() => void loadEarlier()}
                  disabled={loadingEarlier}
                  className="rounded-xl px-4 py-1.5 text-xs font-semibold transition-opacity hover:opacity-70 disabled:opacity-40"
                  style={{ border: "1px solid var(--border)", color: "var(--medium-gray)", backgroundColor: "var(--surface)" }}
                >
                  {loadingEarlier ? "Loading…" : "Load earlier"}
                </button>
              </div>
            )}
            {grouped.map(({ message, showDay, showTail }) => (
              <div key={message.id}>
                {showDay && (
                  <div className="flex justify-center py-3">
                    <span className="rounded-full px-3 py-1 text-[10px] font-semibold" style={{ backgroundColor: "var(--surface)", color: "var(--medium-gray)" }}>
                      {fmtDay(message.timestamp)}
                    </span>
                  </div>
                )}
                <MessageBubble message={message} isMe={message.senderId === currentUserId} showTail={showTail} />
              </div>
            ))}
            <AnimatePresence>
              {typing && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-start pt-1">
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-md px-4 py-2.5" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: "var(--medium-gray)" }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mx-4 mb-2 flex items-center justify-between rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger-strong)" }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-2 font-bold">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <Composer conversationId={conversation.id} onSend={handleSend} onSendImage={handleSendImage} />
    </div>
  );
};
