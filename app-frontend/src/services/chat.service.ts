import { httpClient } from "./http";
import type {
  ChatConversation,
  ChatMessage,
  GetConversationsResponse,
  GetMessagesResponse,
  SendMessageResponse
} from "../types/chat";

/**
 * Module-level pub/sub fired whenever a markRead resolves. The
 * UnreadMessagesProvider subscribes to this and refetches its total. This
 * is the durable refresh path for surfaces whose data comes from the
 * user-side /chat/conversations endpoint — the `chat:read` socket event
 * is not always reachable (e.g. legacy "stub admin" conversations where
 * the real admin isn't in the participants array, so emitToUser skips them).
 */
type UnreadStaleListener = () => void;
const unreadStaleListeners = new Set<UnreadStaleListener>();
export const onUnreadCountStale = (listener: UnreadStaleListener): (() => void) => {
  unreadStaleListeners.add(listener);
  return () => {
    unreadStaleListeners.delete(listener);
  };
};
const notifyUnreadCountStale = () => {
  unreadStaleListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* listener errors are not the markRead caller's problem */
    }
  });
};

// Support-admin id resolution.
//
// History: this used to be a hardcoded ObjectId ("000...001") that never
// matched a real user. That created two bugs at once: (a) when an admin
// tried to mark a thread read their real id wasn't in participants so the
// update missed, and (b) admin-initiated "Message User" produced a SEPARATE
// thread under (realAdminId, userId) which the user could never reach.
//
// New model: fetch the canonical admin id from the backend once per session
// via GET /auth/support-admin. The backend sources it from
// PRIMARY_SUPPORT_ADMIN_ID env var or the oldest admin user. The legacy
// constant is kept as a build-time fallback for offline boot / dev only.
const LEGACY_FALLBACK_SUPPORT_ADMIN_ID =
  process.env.EXPO_PUBLIC_SUPPORT_ADMIN_ID || "000000000000000000000001";

let cachedSupportAdminId: string | null = null;
let supportAdminInflight: Promise<string> | null = null;

const resolveSupportAdminId = async (): Promise<string> => {
  if (cachedSupportAdminId) return cachedSupportAdminId;
  if (supportAdminInflight) return supportAdminInflight;
  supportAdminInflight = (async () => {
    try {
      const response = await httpClient.get<{ supportAdminId: string }>(
        "/auth/support-admin"
      );
      const id = response?.supportAdminId;
      if (id && typeof id === "string") {
        cachedSupportAdminId = id;
        return id;
      }
    } catch {
      // network / 5xx / 404 (backend not yet deployed) — fall through
    } finally {
      supportAdminInflight = null;
    }
    return LEGACY_FALLBACK_SUPPORT_ADMIN_ID;
  })();
  return supportAdminInflight;
};

class ChatService {
  async listConversations(): Promise<GetConversationsResponse> {
    return httpClient.get<GetConversationsResponse>("/chat/conversations");
  }

  /**
   * Optional `productId` is forwarded to the backend so the createConversation
   * controller can enforce the seller's contactPreferences.allowChat gate (the
   * frontend `isChatAllowed` mirror added in step 3 of the seller-chat unify
   * effort). Support chat omits it.
   */
  async startConversation(participantId?: string, options?: { productId?: string }): Promise<string> {
    const payload: { participantId?: string; productId?: string } = {};
    if (participantId) {
      payload.participantId = participantId;
    } else {
      // Resolve the real support-admin id at call time (cached after the
      // first hit). Legacy fallback only kicks in when the backend can't
      // be reached, which gives us graceful degradation for the deploy
      // window where the new /auth/support-admin route isn't live yet.
      payload.participantId = await resolveSupportAdminId();
    }
    if (options?.productId) payload.productId = options.productId;
    const response = await httpClient.post<{ conversationId: string }>("/chat/conversations", payload);
    return response.conversationId;
  }

  async getMessages(conversationId: string, params?: { limit?: number; offset?: number }): Promise<GetMessagesResponse> {
    return httpClient.get<GetMessagesResponse>(`/chat/conversations/${conversationId}/messages`, { params });
  }

  /**
   * Sends a plain text message. Optionally attaches a `contextRef` so the
   * server pins it to the message (seller chat uses this to stamp the
   * product reference on the first outbound message, so the seller's inbox
   * sees the same pinned card the buyer does).
   */
  async sendMessage(
    conversationId: string,
    content: string,
    options?: { contextRef?: { type: string; refId?: string; label?: string; imageUrl?: string } }
  ): Promise<SendMessageResponse> {
    return httpClient.post<SendMessageResponse>(`/chat/conversations/${conversationId}/messages`, {
      content,
      contextRef: options?.contextRef,
    });
  }

  /**
   * Upload an image and create a chat message with the attachment URL.
   * Backend uploads the base64 to S3 (user-uploads/<userId>/chat-<ts>-<name>)
   * and creates a ChatMessage with `attachments: [{ url, type, name, size }]`.
   */
  async sendImage(
    conversationId: string,
    payload: { base64: string; fileName?: string; mimeType: string; caption?: string }
  ): Promise<SendMessageResponse> {
    return httpClient.post<SendMessageResponse>(
      `/chat/conversations/${conversationId}/images`,
      payload
    );
  }

  async markRead(conversationId: string): Promise<void> {
    await httpClient.post(`/chat/conversations/${conversationId}/read`, {});
    // Fire-and-forget notify — surfaces that subscribe via onUnreadCountStale
    // (e.g. UnreadMessagesProvider) refetch their totals. This is what
    // unblocks the OPS-tab footer badge for stub admin conversations where
    // the chat:read socket event would otherwise never reach the admin.
    notifyUnreadCountStale();
  }

  async logCall(payload: { conversationId?: string; calleeId: string; startedAt?: Date; endedAt?: Date; durationSeconds?: number; notes?: string }) {
    return httpClient.post<{ callLog: any }>("/chat/call-logs", {
      ...payload,
      startedAt: payload.startedAt?.toISOString(),
      endedAt: payload.endedAt?.toISOString()
    });
  }
}

export const chatService = new ChatService();
