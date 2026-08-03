import { httpClient, QueryParams } from "../lib/http-client";
import type {
  ChatConversation,
  ChatMessage,
  ChatContextRef,
  GetConversationsResponse,
  GetMessagesResponse,
  SendMessageResponse,
  UnreadCountResponse,
  ListAdminConversationsResponse,
  AdminChatConversationDetail,
  ListAdminCallLogsResponse,
} from "../types/chat";

// Mirrors app-frontend/src/services/chat.service.ts — kept as a structural
// mirror of the same backend contract (there's no shared package in this
// repo). Change both together.

// Strips undefined/empty-string values before they hit the wire — several
// admin filter params (search, userId, companyId) are `optional().isString().
// isLength({min:1})` on the backend, so an empty string from a cleared
// search box would 422 rather than just being treated as "no filter".
const toQuery = (params?: Record<string, unknown>): QueryParams | undefined => {
  if (!params) return undefined;
  const out: QueryParams = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") out[k] = v;
    }
  });
  return Object.keys(out).length ? out : undefined;
};

// ── Support-admin id resolution ─────────────────────────────────────────────
// Same rationale as the app: "Contact support" needs a real recipient id.
// Resolved once per session via GET /auth/support-admin and cached.
let cachedSupportAdminId: string | null = null;
let supportAdminInflight: Promise<string> | null = null;

const resolveSupportAdminId = async (): Promise<string> => {
  if (cachedSupportAdminId) return cachedSupportAdminId;
  if (supportAdminInflight) return supportAdminInflight;
  supportAdminInflight = (async () => {
    try {
      const response = await httpClient.get<{ supportAdminId: string }>("/auth/support-admin");
      if (response?.supportAdminId) {
        cachedSupportAdminId = response.supportAdminId;
        return response.supportAdminId;
      }
    } catch {
      // network / 5xx — fall through to the caller failing the request,
      // same as the app; there's no safe hardcoded fallback id on web.
    } finally {
      supportAdminInflight = null;
    }
    throw new Error("Unable to resolve the support conversation right now.");
  })();
  return supportAdminInflight;
};

const listConversations = (params?: { limit?: number; offset?: number }) =>
  httpClient.get<GetConversationsResponse>("/chat/conversations", { params: toQuery(params as Record<string, unknown>) });

const getUnreadCount = () =>
  httpClient.get<UnreadCountResponse>("/chat/unread-count").then((r) => r.count);

/**
 * `productId` lets the backend enforce the seller's `contactPreferences.
 * allowChat` gate (mirrors the app). Omit it (or omit `participantId`
 * entirely) to start/reuse the support conversation.
 */
const startConversation = async (participantId?: string, options?: { productId?: string }): Promise<string> => {
  const payload: { participantId?: string; productId?: string } = {};
  payload.participantId = participantId || (await resolveSupportAdminId());
  if (options?.productId) payload.productId = options.productId;
  const response = await httpClient.post<{ conversationId: string }>("/chat/conversations", payload);
  return response.conversationId;
};

const getMessages = (conversationId: string, params?: { limit?: number; offset?: number }) =>
  httpClient.get<GetMessagesResponse>(`/chat/conversations/${conversationId}/messages`, { params: toQuery(params as Record<string, unknown>) });

const sendMessage = (conversationId: string, content: string, options?: { contextRef?: ChatContextRef }) =>
  httpClient.post<SendMessageResponse>(`/chat/conversations/${conversationId}/messages`, {
    content,
    contextRef: options?.contextRef,
  });

const sendImage = (
  conversationId: string,
  payload: { base64: string; fileName?: string; mimeType: string; caption?: string }
) => httpClient.post<SendMessageResponse>(`/chat/conversations/${conversationId}/images`, payload);

const markRead = (conversationId: string) =>
  httpClient.post<void>(`/chat/conversations/${conversationId}/read`, {});

const logCall = (payload: {
  conversationId?: string;
  calleeId: string;
  startedAt?: Date;
  endedAt?: Date;
  durationSeconds?: number;
  notes?: string;
}) =>
  httpClient.post(`/chat/call-logs`, {
    ...payload,
    startedAt: payload.startedAt?.toISOString(),
    endedAt: payload.endedAt?.toISOString(),
  });

// ── Admin console ────────────────────────────────────────────────────────

const listAdminConversations = (params?: {
  search?: string;
  userId?: string;
  companyId?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}) => httpClient.get<ListAdminConversationsResponse>("/admin/conversations", { params: toQuery(params as Record<string, unknown>) });

const getAdminConversation = (conversationId: string) =>
  httpClient
    .get<{ conversation: AdminChatConversationDetail }>(`/admin/conversations/${conversationId}`)
    .then((r) => r.conversation);

const getAdminConversationMessages = (conversationId: string, params?: { limit?: number; offset?: number }) =>
  httpClient.get<GetMessagesResponse>(`/admin/conversations/${conversationId}/messages`, { params: toQuery(params as Record<string, unknown>) });

const listAdminCallLogs = (params?: {
  userId?: string;
  companyId?: string;
  from?: string;
  to?: string;
  minDuration?: number;
  maxDuration?: number;
  sort?: string;
  limit?: number;
  offset?: number;
}) => httpClient.get<ListAdminCallLogsResponse>("/admin/call-logs", { params: toQuery(params as Record<string, unknown>) });

export const chatService = {
  listConversations,
  getUnreadCount,
  startConversation,
  getMessages,
  sendMessage,
  sendImage,
  markRead,
  logCall,
  listAdminConversations,
  getAdminConversation,
  getAdminConversationMessages,
  listAdminCallLogs,
};

export type { ChatConversation, ChatMessage };
