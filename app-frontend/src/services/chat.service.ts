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

  async startConversation(participantId?: string): Promise<string> {
    const payload: { participantId?: string } = {};
    if (participantId) {
      payload.participantId = participantId;
    } else if (SUPPORT_ADMIN_ID) {
      payload.participantId = SUPPORT_ADMIN_ID;
    } else {
      throw new Error("Support admin is not configured. Please provide a participantId.");
    }
    const response = await httpClient.post<{ conversationId: string }>("/chat/conversations", payload);
    return response.conversationId;
  }

  async getMessages(conversationId: string, params?: { limit?: number; offset?: number }): Promise<GetMessagesResponse> {
    return httpClient.get<GetMessagesResponse>(`/chat/conversations/${conversationId}/messages`, { params });
  }

  async sendMessage(conversationId: string, content: string): Promise<SendMessageResponse> {
    return httpClient.post<SendMessageResponse>(`/chat/conversations/${conversationId}/messages`, { content });
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
