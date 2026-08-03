"use client";

import { motion } from "framer-motion";
import { useChat } from "@/src/providers/ChatProvider";
import type { ChatConversation } from "@/src/types/chat";

const getInitials = (name?: string | null) =>
  (name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const fmtConvTime = (d?: string) => {
  if (!d) return "";
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export const ConversationList = ({
  activeId,
  onSelect,
}: {
  activeId: string | null;
  onSelect: (conversation: ChatConversation) => void;
}) => {
  const { conversations, loading, loadingMore, hasMore, loadMore, isTyping } = useChat();

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 p-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="h-11 w-11 flex-shrink-0 animate-pulse rounded-full" style={{ backgroundColor: "var(--surface)" }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 animate-pulse rounded" style={{ backgroundColor: "var(--surface)" }} />
                <div className="h-2.5 w-36 animate-pulse rounded" style={{ backgroundColor: "var(--surface)" }} />
              </div>
            </div>
          ))
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-16">
            <div className="text-3xl">💬</div>
            <p className="text-center text-sm font-semibold" style={{ color: "var(--foreground)" }}>No conversations yet</p>
            <p className="text-center text-xs" style={{ color: "var(--medium-gray)" }}>
              Start a chat from a product page or quote to begin messaging.
            </p>
          </div>
        ) : (
          <>
            {conversations.map((c, i) => {
              const active = c.id === activeId;
              const name = c.otherParticipant?.name ?? "Support";
              const typing = isTyping(c.id);
              return (
                <motion.button
                  key={c.id}
                  layout="position"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i, 8) * 0.02 }}
                  onClick={() => onSelect(c)}
                  className="flex w-full items-center gap-3 p-4 text-left transition-colors"
                  style={{
                    borderBottom: "1px solid var(--border)",
                    backgroundColor: active ? "var(--primary)" : "transparent",
                  }}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold"
                      style={{ backgroundColor: active ? "rgba(255,255,255,0.2)" : "var(--surface)", color: active ? "#fff" : "var(--primary)" }}
                    >
                      {getInitials(name)}
                    </div>
                    {(c.unreadCount ?? 0) > 0 && !active && (
                      <span
                        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                        style={{ backgroundColor: "var(--primary)" }}
                      >
                        {c.unreadCount > 9 ? "9+" : c.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold" style={{ color: active ? "#fff" : "var(--foreground)" }}>{name}</p>
                      {c.lastMessageAt && (
                        <span className="flex-shrink-0 text-[10px]" style={{ color: active ? "rgba(255,255,255,0.7)" : "var(--medium-gray)" }}>
                          {fmtConvTime(c.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    {typing ? (
                      <p className="mt-0.5 text-xs font-semibold" style={{ color: active ? "#fff" : "var(--primary)" }}>typing…</p>
                    ) : (
                      c.lastMessage && (
                        <p className="mt-0.5 truncate text-xs" style={{ color: active ? "rgba(255,255,255,0.7)" : "var(--medium-gray)" }}>
                          {c.lastMessage}
                        </p>
                      )
                    )}
                  </div>
                </motion.button>
              );
            })}
            {hasMore && (
              <div className="flex justify-center py-3">
                <button
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="rounded-full px-4 py-1.5 text-xs font-semibold transition-opacity hover:opacity-70 disabled:opacity-40"
                  style={{ border: "1px solid var(--border)", color: "var(--medium-gray)", backgroundColor: "var(--surface)" }}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
