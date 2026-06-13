export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: "admin" | "user" | "support";
  content: string;
  timestamp: string;
  read: boolean;
};

export type ChatParticipant = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
};

export type ChatConversation = {
  id: string;
  otherParticipant: ChatParticipant | null;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type GetConversationsResponse = { conversations: ChatConversation[] };
export type GetMessagesResponse = {
  messages: ChatMessage[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
};
export type SendMessageResponse = { message: ChatMessage };
