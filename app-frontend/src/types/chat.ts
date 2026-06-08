/**
 * Chat Types
 *
 * This file defines all the types used for the chat functionality.
 *
 * HOW IT WORKS:
 * - ChatMessage: Represents a single message in a conversation
 * - ChatConversation: Represents a chat thread between admin and user
 * - ChatUser: Represents a user that admin can chat with
 */

export type ChatAttachment = {
  url: string;
  /** MIME type — used by the bubble renderer to decide image vs file icon */
  type?: string;
  name?: string;
  size?: number;
};

export type ChatContextRef = {
  /** Discriminator for the referenced entity. Currently only "product". */
  type: string;
  refId?: string;
  label?: string;
  imageUrl?: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: "admin" | "user" | "support";
  content: string;
  attachments?: ChatAttachment[];
  /**
   * Optional reference to whatever this message is about — currently the
   * product the buyer is asking about. ChatScreen falls back to the latest
   * non-null contextRef in message history when its route params don't
   * include productId (e.g. when the seller opens the inbox).
   */
  contextRef?: ChatContextRef;
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

// User that admin can see and chat with
export type ChatUser = {
  id: string;
  displayName: string;
  email: string;
  phone?: string; // Phone number for admin to call
  companyName?: string;
  avatarUrl?: string;
  lastSeen?: string;
  hasActiveConversation: boolean;
  conversationId?: string;
  unreadCount: number;
};

// Request/Response types for API calls
export type SendMessageRequest = {
  conversationId: string;
  content: string;
};

export type SendMessageResponse = {
  message: ChatMessage;
};

export type GetMessagesResponse = {
  messages: ChatMessage[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
};

export type GetConversationsResponse = {
  conversations: ChatConversation[];
};

export type GetUsersForChatResponse = {
  users: ChatUser[];
};

export type StartConversationResponse = {
  conversationId: string;
};
