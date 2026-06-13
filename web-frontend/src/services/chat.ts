import { httpClient } from "../lib/http-client";
import type { ChatConversation, ChatMessage, GetConversationsResponse, GetMessagesResponse, SendMessageResponse } from "../types/chat";

const listConversations = () =>
  httpClient.get<GetConversationsResponse>("/chat/conversations");

const startConversation = (participantId?: string) =>
  httpClient.post<{ conversationId: string }>("/chat/conversations", { participantId })
    .then((r) => r.conversationId);

const getMessages = (conversationId: string, params?: { limit?: number; offset?: number }) =>
  httpClient.get<GetMessagesResponse>(`/chat/conversations/${conversationId}/messages`, { params });

const sendMessage = (conversationId: string, content: string) =>
  httpClient.post<SendMessageResponse>(`/chat/conversations/${conversationId}/messages`, { content });

const markRead = (conversationId: string) =>
  httpClient.post<void>(`/chat/conversations/${conversationId}/read`, {});

export const chatService = { listConversations, startConversation, getMessages, sendMessage, markRead };

export type { ChatConversation, ChatMessage };
