"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { useChat } from "@/src/providers/ChatProvider";
import { chatService } from "@/src/services/chat";
import { PageHeader } from "@/src/components/ui/Surface";
import { MessageThread } from "@/src/features/chat/components/MessageThread";
import type { AdminChatConversation, ChatConversation, Pagination } from "@/src/types/chat";
import { AdminConversationList } from "./AdminConversationList";
import { AdminCallLogPanel } from "./AdminCallLogPanel";

const PAGE_SIZE = 30;
const SEARCH_DEBOUNCE_MS = 300;

type Tab = "conversations" | "calls";

/**
 * Web's admin chat surface — previously nonexistent (X7), so a user who
 * messaged support from the web could only be answered from the mobile app.
 * Reuses MessageThread/Composer/MessageBubble from the user chat feature
 * (they only depend on conversation id + currentUserId, and the backend's
 * participant-or-admin access rule already lets an admin read/reply to any
 * thread), backed by the admin-only `/admin/conversations` queue instead of
 * the personal `/chat/conversations` list.
 */
export const AdminChatConsole = () => {
  const { user } = useAuth();
  const { onMessage, onRead } = useChat();

  const [tab, setTab] = useState<Tab>("conversations");
  const [conversations, setConversations] = useState<AdminChatConversation[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeConv, setActiveConv] = useState<AdminChatConversation | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [search]);

  const load = useCallback(
    async (offset: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const res = await chatService.listAdminConversations({
          search: debouncedSearch || undefined,
          limit: PAGE_SIZE,
          offset,
        });
        setConversations((prev) => (append ? [...prev, ...(res.conversations ?? [])] : (res.conversations ?? [])));
        setPagination(res.pagination);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch]
  );

  useEffect(() => {
    void load(0, false);
  }, [load]);

  // Realtime — keep this admin's own list (not the shared user-facing one
  // ChatProvider owns) in sync so a new inbound message reorders/updates it
  // without a manual refresh.
  useEffect(() => {
    const upsert = (conversationId: string, patch: Partial<ChatConversation> | null | undefined) => {
      if (!patch) return;
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conversationId);
        if (idx === -1) return prev;
        const merged = { ...prev[idx], ...patch };
        const next = prev.filter((c) => c.id !== conversationId);
        next.unshift(merged);
        return next;
      });
      setActiveConv((prev) => (prev && prev.id === conversationId ? { ...prev, ...patch } : prev));
    };

    const offMessage = onMessage((payload) => upsert(payload.conversationId, payload.conversation));
    const offRead = onRead((payload) => upsert(payload.conversationId, payload.conversation));
    return () => {
      offMessage();
      offRead();
    };
  }, [onMessage, onRead]);

  const handleSelect = useCallback((conversation: AdminChatConversation) => {
    setActiveConv(conversation);
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Chat"
        actions={
          <div className="flex gap-2">
            {(["conversations", "calls"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="rounded-full px-3 py-1.5 text-xs font-bold capitalize transition-all"
                style={{
                  backgroundColor: tab === t ? "var(--primary)" : "var(--surface)",
                  color: tab === t ? "#fff" : "var(--foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                {t === "conversations" ? "Conversations" : "Call logs"}
              </button>
            ))}
          </div>
        }
      />

      {tab === "calls" ? (
        <div className="rounded-2xl" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
          <AdminCallLogPanel />
        </div>
      ) : (
        <div className="flex h-[calc(100vh-220px)] min-h-[520px] overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
          <div className="flex w-full max-w-xs flex-shrink-0 flex-col" style={{ borderRight: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
            <AdminConversationList
              conversations={conversations}
              loading={loading}
              loadingMore={loadingMore}
              pagination={pagination}
              activeId={activeConv?.id ?? null}
              search={search}
              onSearchChange={setSearch}
              onSelect={handleSelect}
              onLoadMore={() => void load(pagination.offset + PAGE_SIZE, true)}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            {activeConv ? (
              <>
                {activeConv.linkedServiceRequest && (
                  <div className="flex-shrink-0 px-4 py-2 text-xs font-semibold" style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                    Linked request: {activeConv.linkedServiceRequest.title} · {activeConv.linkedServiceRequest.status}
                  </div>
                )}
                <div className="min-h-0 flex-1">
                  <MessageThread conversation={activeConv} currentUserId={user.id} />
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
                <div className="text-5xl">💬</div>
                <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Select a conversation</p>
                <p className="max-w-xs text-center text-sm" style={{ color: "var(--medium-gray)" }}>
                  Pick a conversation from the queue to read and reply.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
