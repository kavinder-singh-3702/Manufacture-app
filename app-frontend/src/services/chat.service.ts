import { httpClient } from "./http";
import type {
  ChatConversation,
  ChatMessage,
  GetConversationsResponse,
  GetMessagesResponse,
  SendMessageResponse
} from "../types/chat";

// Support admin ID - hardcoded fallback if env var not available in runtime
const SUPPORT_ADMIN_ID = process.env.EXPO_PUBLIC_SUPPORT_ADMIN_ID || "000000000000000000000001";

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
    } else if (SUPPORT_ADMIN_ID) {
      payload.participantId = SUPPORT_ADMIN_ID;
    } else {
      throw new Error("Support admin is not configured. Please provide a participantId.");
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
