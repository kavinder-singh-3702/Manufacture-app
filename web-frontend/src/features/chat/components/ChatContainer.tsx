"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { chatService } from "@/src/services/chat";
import type { ChatConversation, ChatMessage } from "@/src/types/chat";
import { ApiError } from "@/src/lib/api-error";

// ── Helpers ───────────────────────────────────────────────────────────────────

const getInitials = (name?: string | null) =>
  (name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const fmtTime = (d: string) => {
  const date = new Date(d);
  const h = date.getHours() % 12 || 12;
  const m = date.getMinutes();
  const ap = date.getHours() >= 12 ? "PM" : "AM";
  return `${h}:${m < 10 ? "0" + m : m} ${ap}`;
};

const fmtDay = (d: string) => {
  const date = new Date(d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = today.getTime() - msgDay.getTime();
  if (diff === 0) return "Today";
  if (diff === 86400000) return "Yesterday";
  if (diff < 7 * 86400000) return date.toLocaleDateString("en-US", { weekday: "long" });
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const fmtConvTime = (d?: string) => {
  if (!d) return "";
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

// ── Conversation List ─────────────────────────────────────────────────────────

type ConvListProps = {
  conversations: ChatConversation[];
  activeId: string | null;
  onSelect: (c: ChatConversation) => void;
  loading: boolean;
  currentUserId: string;
};

const ConversationList = ({ conversations, activeId, onSelect, loading, currentUserId: _uid }: ConvListProps) => (
  <div className="flex flex-col h-full">
    <div className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>Messages</p>
      <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Chat</h2>
    </div>

    <div className="flex-1 overflow-y-auto">
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="h-11 w-11 animate-pulse rounded-full flex-shrink-0" style={{ backgroundColor: "var(--surface)" }} />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 animate-pulse rounded" style={{ backgroundColor: "var(--surface)" }} />
              <div className="h-2.5 w-36 animate-pulse rounded" style={{ backgroundColor: "var(--surface)" }} />
            </div>
          </div>
        ))
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 gap-2">
          <div className="text-3xl">💬</div>
          <p className="text-sm font-semibold text-center" style={{ color: "var(--foreground)" }}>No conversations yet</p>
          <p className="text-xs text-center" style={{ color: "var(--medium-gray)" }}>
            Start a chat from a product page or quote to begin messaging.
          </p>
        </div>
      ) : (
        conversations.map((c) => {
          const active = c.id === activeId;
          const name = c.otherParticipant?.name ?? "Support";
          return (
            <button key={c.id} onClick={() => onSelect(c)}
              className="flex w-full items-center gap-3 p-4 text-left transition-colors"
              style={{
                borderBottom: "1px solid var(--border)",
                backgroundColor: active ? "var(--primary)" : "transparent",
              }}>
              <div className="relative flex-shrink-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold"
                  style={{ backgroundColor: active ? "rgba(255,255,255,0.2)" : "var(--surface)", color: active ? "#fff" : "var(--primary)" }}>
                  {getInitials(name)}
                </div>
                {(c.unreadCount ?? 0) > 0 && !active && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ backgroundColor: "var(--primary)" }}>
                    {c.unreadCount > 9 ? "9+" : c.unreadCount}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold truncate" style={{ color: active ? "#fff" : "var(--foreground)" }}>{name}</p>
                  {c.lastMessageAt && (
                    <span className="text-[10px] flex-shrink-0 ml-2" style={{ color: active ? "rgba(255,255,255,0.7)" : "var(--medium-gray)" }}>
                      {fmtConvTime(c.lastMessageAt)}
                    </span>
                  )}
                </div>
                {c.lastMessage && (
                  <p className="truncate text-xs mt-0.5" style={{ color: active ? "rgba(255,255,255,0.7)" : "var(--medium-gray)" }}>
                    {c.lastMessage}
                  </p>
                )}
              </div>
            </button>
          );
        })
      )}
    </div>
  </div>
);

// ── Message Thread ────────────────────────────────────────────────────────────

const PAGE_SIZE = 40;

type ThreadProps = {
  conversation: ChatConversation;
  currentUserId: string;
};

const MessageThread = ({ conversation, currentUserId }: ThreadProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const loadMessages = useCallback(async (off = 0, append = false) => {
    try {
      if (append) setLoadingEarlier(true);
      const res = await chatService.getMessages(conversation.id, { limit: PAGE_SIZE, offset: off });
      const incoming = [...(res.messages ?? [])].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setMessages((prev) => {
        if (append) {
          const existingIds = new Set(prev.map((m) => m.id));
          const older = incoming.filter((m) => !existingIds.has(m.id));
          return [...older, ...prev];
        }
        return incoming;
      });
      setHasMore(res.pagination?.hasMore ?? false);
      setOffset(off);
      if (off === 0) {
        chatService.markRead(conversation.id).catch(() => {});
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch { /* silent */ }
    finally { setLoading(false); setLoadingEarlier(false); }
  }, [conversation.id]);

  const pollMessages = useCallback(async () => {
    try {
      const res = await chatService.getMessages(conversation.id, { limit: PAGE_SIZE, offset: 0 });
      const incoming = [...(res.messages ?? [])].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMsgs = incoming.filter((m) => !existingIds.has(m.id));
        if (newMsgs.length === 0) return prev;
        chatService.markRead(conversation.id).catch(() => {});
        return [...prev, ...newMsgs];
      });
    } catch { /* silent */ }
  }, [conversation.id]);

  useEffect(() => {
    setMessages([]); setLoading(true); setHasMore(false); setOffset(0);
    loadMessages(0, false);

    // Only poll while the tab is visible — an idle background tab otherwise
    // hits the backend every 5s indefinitely. Resume (and fetch immediately)
    // when the user returns to the tab.
    const startPolling = () => {
      if (pollingRef.current) return;
      pollingRef.current = setInterval(pollMessages, 5000);
    };
    const stopPolling = () => {
      clearInterval(pollingRef.current);
      pollingRef.current = undefined;
    };
    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        pollMessages();
        startPolling();
      }
    };

    if (!document.hidden) startPolling();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadMessages, pollMessages]);

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const optimisticId = `opt-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: optimisticId, conversationId: conversation.id,
      senderId: currentUserId, senderRole: "user", content: text, timestamp: new Date().toISOString(), read: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    try {
      setSending(true);
      const res = await chatService.sendMessage(conversation.id, text);
      if (res?.message) {
        setMessages((prev) => prev.map((m) => m.id === optimisticId ? { ...res.message } : m));
      }
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to send");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } finally {
      setSending(false);
    }
  };

  const name = conversation.otherParticipant?.name ?? "Support";

  const shouldShowDay = (idx: number) => {
    if (idx === 0) return true;
    const a = messages[idx - 1].timestamp;
    const b = messages[idx].timestamp;
    return fmtDay(a) !== fmtDay(b);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
          {getInitials(name)}
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{name}</p>
          {conversation.otherParticipant?.phone && (
            <p className="text-xs" style={{ color: "var(--medium-gray)" }}>{conversation.otherParticipant.phone}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: "var(--primary)" }} />
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center pb-3">
                <button onClick={() => loadMessages(offset + PAGE_SIZE, true)} disabled={loadingEarlier}
                  className="rounded-xl px-4 py-1.5 text-xs font-semibold transition-opacity hover:opacity-70 disabled:opacity-40"
                  style={{ border: "1px solid var(--border)", color: "var(--medium-gray)", backgroundColor: "var(--surface)" }}>
                  {loadingEarlier ? "Loading…" : "Load earlier"}
                </button>
              </div>
            )}
            {messages.map((msg, idx) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div key={msg.id}>
                  {shouldShowDay(idx) && (
                    <div className="flex justify-center py-3">
                      <span className="rounded-full px-3 py-1 text-[10px] font-semibold"
                        style={{ backgroundColor: "var(--surface)", color: "var(--medium-gray)" }}>
                        {fmtDay(msg.timestamp)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
                    <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 ${isMe ? "rounded-br-md" : "rounded-bl-md"}`}
                      style={{
                        backgroundColor: isMe ? "var(--primary)" : "var(--surface)",
                        border: isMe ? "none" : "1px solid var(--border)",
                      }}>
                      <p className="text-sm leading-relaxed" style={{ color: isMe ? "#fff" : "var(--foreground)" }}>
                        {msg.content}
                      </p>
                      <p className="mt-1 text-right text-[10px]"
                        style={{ color: isMe ? "rgba(255,255,255,0.6)" : "var(--medium-gray)" }}>
                        {fmtTime(msg.timestamp)}
                        {isMe && <span className="ml-1">{msg.read ? " ✓✓" : " ✓"}</span>}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="mx-4 mb-2 flex items-center justify-between rounded-xl px-3 py-2 text-xs"
            style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold ml-2">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="flex items-end gap-2 p-3" style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
        <textarea value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message… (Enter to send)"
          rows={1} maxLength={2000}
          className="flex-1 resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{
            backgroundColor: "var(--background)", border: "1px solid var(--border)",
            color: "var(--foreground)", maxHeight: "120px",
          }} />
        <button onClick={handleSend} disabled={!input.trim() || sending}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
          {sending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-white" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

// ── Main ChatContainer ────────────────────────────────────────────────────────

type Props = { currentUserId: string };

export const ChatContainer = ({ currentUserId }: Props) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConv, setActiveConv] = useState<ChatConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(true);

  const loadConvs = useCallback(async () => {
    try {
      const res = await chatService.listConversations();
      const convs = res.conversations ?? [];
      setConversations(convs);
      if (!activeConv && convs.length > 0) setActiveConv(convs[0]);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [activeConv]);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  const handleSelect = (c: ChatConversation) => {
    setActiveConv(c);
    setShowList(false);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[500px] overflow-hidden rounded-2xl"
      style={{ border: "1px solid var(--border)" }}>
      {/* Sidebar — always visible on lg, toggleable on mobile */}
      <div className={`flex-shrink-0 w-full lg:w-72 xl:w-80 ${showList ? "flex" : "hidden"} lg:flex flex-col`}
        style={{ borderRight: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
        <ConversationList
          conversations={conversations}
          activeId={activeConv?.id ?? null}
          onSelect={handleSelect}
          loading={loading}
          currentUserId={currentUserId}
        />
      </div>

      {/* Thread panel */}
      <div className={`flex-1 flex-col min-w-0 ${!showList || activeConv ? "flex" : "hidden"} lg:flex`}
        style={{ backgroundColor: "var(--background)" }}>
        {activeConv ? (
          <>
            {/* Mobile back button */}
            <div className="flex items-center gap-2 px-3 pt-3 lg:hidden">
              <button onClick={() => setShowList(true)}
                className="rounded-xl px-3 py-1.5 text-xs font-bold"
                style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}>
                ← Back
              </button>
            </div>
            <MessageThread key={activeConv.id} conversation={activeConv} currentUserId={currentUserId} />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <div className="text-5xl">💬</div>
            <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Select a conversation</p>
            <p className="text-sm text-center max-w-xs" style={{ color: "var(--medium-gray)" }}>
              Pick a conversation from the list to start chatting, or begin a new chat from a product or quote page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
