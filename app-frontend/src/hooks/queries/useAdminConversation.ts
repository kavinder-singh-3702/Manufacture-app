import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  adminService,
  AdminConversationDetail,
  AdminConversationMessage,
  Pagination,
} from "../../services/admin.service";
import { chatService } from "../../services/chat.service";

export const ADMIN_CONVERSATION_KEY = ["admin", "conversation"] as const;
const PAGE_SIZE = 50;

/** True when an HTTP error looks like a 404 — we use this to fall back from
 *  the new admin endpoint to the existing user-side one before the backend
 *  rollout is complete. */
const is404 = (err: unknown): boolean => {
  if (!err) return false;
  const status =
    (err as { response?: { status?: number } })?.response?.status ??
    (err as { status?: number })?.status;
  if (status === 404) return true;
  const message = (err as { message?: string })?.message || "";
  return /\b404\b|not found/i.test(message);
};

/**
 * Fetch a single admin conversation summary. Pairs with `useAdminConversationMessages`
 * which streams the message history.
 */
export const useAdminConversation = (id: string | undefined) => {
  const query = useQuery({
    queryKey: id ? [...ADMIN_CONVERSATION_KEY, id] : [...ADMIN_CONVERSATION_KEY, "noop"],
    enabled: Boolean(id),
    queryFn: async (): Promise<AdminConversationDetail> => {
      if (!id) throw new Error("id is required");
      return adminService.getAdminConversation(id);
    },
  });
  return {
    conversation: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
    error: query.error,
  };
};

type MessagesPage = {
  messages: AdminConversationMessage[];
  pagination: Pagination;
};

export const useAdminConversationMessages = (id: string | undefined) => {
  const query = useInfiniteQuery({
    queryKey: id
      ? [...ADMIN_CONVERSATION_KEY, id, "messages"]
      : [...ADMIN_CONVERSATION_KEY, "noop", "messages"],
    enabled: Boolean(id),
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<MessagesPage> => {
      if (!id) throw new Error("id is required");
      try {
        return await adminService.getAdminConversationMessages(id, {
          limit: PAGE_SIZE,
          offset: pageParam,
        });
      } catch (err) {
        if (!is404(err)) throw err;
        // Backend rollout fallback: the existing /chat/conversations/:id/messages
        // endpoint is open to any authenticated user (no participation check),
        // so admins can read while the new /admin/... route is being deployed.
        const fallback = await chatService.getMessages(id, {
          limit: PAGE_SIZE,
          offset: pageParam,
        });
        return {
          messages: fallback.messages.map((m) => ({
            id: m.id,
            conversationId: m.conversationId,
            senderId: m.senderId,
            senderRole: m.senderRole,
            content: m.content,
            timestamp: m.timestamp,
            read: m.read,
          })),
          pagination: fallback.pagination,
        };
      }
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore
        ? lastPage.pagination.offset + lastPage.pagination.limit
        : undefined,
  });

  const messages = query.data?.pages.flatMap((p) => p.messages) ?? [];
  const total = query.data?.pages[0]?.pagination.total ?? 0;

  return {
    messages,
    total,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: Boolean(query.hasNextPage),
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    error: query.error,
  };
};
