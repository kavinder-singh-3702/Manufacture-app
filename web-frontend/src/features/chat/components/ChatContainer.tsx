"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/src/providers/ChatProvider";
import { chatService } from "@/src/services/chat";
import type { ChatConversation } from "@/src/types/chat";
import { ConversationList } from "./ConversationList";
import { MessageThread } from "./MessageThread";

type Props = {
  currentUserId: string;
  /** From `?conversationId=` — a notification's "Open chat" link, or a
   * freshly-started conversation from a product page (X4/X5). */
  initialConversationId?: string | null;
  initialProductId?: string | null;
};

/**
 * Chat shell. Desktop keeps the two-pane split (list + thread, both always
 * visible); mobile renders full-bleed — `fixed inset-0` escapes the
 * dashboard shell's scrolling `<main>` and fixed bottom tab rail entirely
 * (U1–U3), so there's no double-scroll and the composer never sits under
 * the tab bar. List-first on mobile: a thread only opens on explicit
 * selection or a deep link, never auto-selected (U7).
 */
export const ChatContainer = ({ currentUserId, initialConversationId, initialProductId }: Props) => {
  const router = useRouter();
  const { conversations, loading, refresh } = useChat();
  const [activeConv, setActiveConv] = useState<ChatConversation | null>(null);
  const [pendingProductId, setPendingProductId] = useState<string | null>(initialProductId ?? null);
  const [resolvingDeepLink, setResolvingDeepLink] = useState(Boolean(initialConversationId));
  const [showThreadOnMobile, setShowThreadOnMobile] = useState(Boolean(initialConversationId));

  // Desktop auto-selects the most recent conversation once loaded (nothing
  // to pick from a list the user can't see side-by-side); mobile stays on
  // the list until the user taps something or a deep link resolves.
  useEffect(() => {
    if (activeConv || loading || resolvingDeepLink) return;
    if (typeof window !== "undefined" && window.innerWidth >= 1024 && conversations.length > 0) {
      setActiveConv(conversations[0]);
    }
  }, [activeConv, loading, resolvingDeepLink, conversations]);

  // Resolve the deep-linked conversationId once the list has loaded —
  // previously this query param (which the notification "Open chat" action
  // and the product-page "Message seller" flow both set) was read by
  // nothing, so it silently fell back to whatever conversation loaded first
  // (X4).
  useEffect(() => {
    if (!initialConversationId || loading) return;
    const match = conversations.find((c) => c.id === initialConversationId);
    if (match) {
      setActiveConv(match);
      setShowThreadOnMobile(true);
    }
    setResolvingDeepLink(false);
    // Drop the query params once consumed so a refresh doesn't re-force
    // the same selection over whatever the user navigates to next.
    router.replace("/dashboard/chat");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId, loading, conversations]);

  const handleSelect = useCallback((conversation: ChatConversation) => {
    setActiveConv(conversation);
    setPendingProductId(null);
    setShowThreadOnMobile(true);
  }, []);

  const handleBack = useCallback(() => {
    setShowThreadOnMobile(false);
  }, []);

  const handleRetryDeepLink = useCallback(async () => {
    // The list load can race the deep-linked id (e.g. a brand-new
    // conversation from "Message seller" that hasn't reached this page's
    // first fetch yet) — one refresh covers that without polling.
    setResolvingDeepLink(false);
    await refresh();
  }, [refresh]);

  useEffect(() => {
    if (resolvingDeepLink) {
      const timer = setTimeout(handleRetryDeepLink, 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [resolvingDeepLink, handleRetryDeepLink]);

  return (
    <div
      className="fixed inset-0 z-40 flex overflow-hidden lg:static lg:z-auto lg:h-[calc(100vh-140px)] lg:min-h-[560px] lg:rounded-2xl lg:border"
      style={{
        backgroundColor: "var(--background)",
        borderColor: "var(--border)",
        // env(safe-area-inset-top) resolves to 0px on non-notched (desktop)
        // devices, so this only does anything on mobile — no lg: override
        // needed to zero it out.
        paddingTop: "var(--safe-top)",
      }}
    >
      {/* List pane — always visible at lg; toggled off on mobile once a thread is open. */}
      <div
        className={`w-full flex-shrink-0 flex-col lg:flex lg:w-72 xl:w-80 ${showThreadOnMobile ? "hidden" : "flex"}`}
        style={{ borderRight: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
      >
        <ConversationList
          activeId={activeConv?.id ?? null}
          onSelect={handleSelect}
          onBack={() => router.push("/dashboard")}
        />
      </div>

      {/* Thread pane */}
      <div className={`min-w-0 flex-1 flex-col lg:flex ${showThreadOnMobile || activeConv ? "flex" : "hidden"}`}>
        {activeConv ? (
          <MessageThread
            key={activeConv.id}
            conversation={activeConv}
            currentUserId={currentUserId}
            onBack={handleBack}
            initialProductId={pendingProductId}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <div className="text-5xl">💬</div>
            <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Select a conversation</p>
            <p className="max-w-xs text-center text-sm" style={{ color: "var(--medium-gray)" }}>
              Pick a conversation from the list to start chatting, or begin a new chat from a product or quote page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/** Starts (or reuses) a conversation and returns the full deep-link href — the
 * fix for X5: entry points previously discarded the returned conversationId
 * and pushed a generic `/dashboard/chat`, landing on whichever thread
 * happened to load first instead of the seller just messaged. */
export const startChatAndBuildHref = async (sellerId: string, productId?: string): Promise<string> => {
  const conversationId = await chatService.startConversation(sellerId, productId ? { productId } : undefined);
  const params = new URLSearchParams({ conversationId });
  if (productId) params.set("productId", productId);
  return `/dashboard/chat?${params.toString()}`;
};
