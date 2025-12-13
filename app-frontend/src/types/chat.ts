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

// A single chat message
export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;       // Who sent this message
  senderName: string;     // Display name of sender
  senderRole: "admin" | "user";
  content: string;        // The message text
  timestamp: string;      // ISO date string
  read: boolean;          // Has the recipient read this?
};

// A conversation thread between admin and user
export type ChatConversation = {
  id: string;

  // User info (the non-admin participant)
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string; // Phone number for admin to call
  userCompany?: string;

  // Admin info
  adminId: string;
  adminName: string;

  // Conversation metadata
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;

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
  hasMore: boolean;
};

export type GetConversationsResponse = {
  conversations: ChatConversation[];
};

export type GetUsersForChatResponse = {
  users: ChatUser[];
};

export type StartConversationRequest = {
  userId: string;
};

export type StartConversationResponse = {
  conversation: ChatConversation;
};
