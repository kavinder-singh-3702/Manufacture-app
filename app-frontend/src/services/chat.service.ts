/**
 * Chat Service
 *
 * This service handles all API calls related to chat functionality.
 *
 * HOW IT WORKS:
 * - Uses the httpClient (same as other services) to make API calls
 * - Admin endpoints: get list of users, start conversations
 * - User endpoints: get admin conversation, send messages
 * - Shared endpoints: get messages, send messages, mark as read
 *
 * NOTE: For now, this uses MOCK DATA since the backend doesn't have chat yet.
 * When backend is ready, just uncomment the real API calls.
 */

import { httpClient } from "./http";
import type {
  ChatMessage,
  ChatConversation,
  ChatUser,
  SendMessageRequest,
  SendMessageResponse,
  GetMessagesResponse,
  GetConversationsResponse,
  GetUsersForChatResponse,
  StartConversationRequest,
  StartConversationResponse,
} from "../types/chat";

// ============================================================
// MOCK DATA (Remove this section when backend is ready)
// ============================================================

// Mock admin user
const MOCK_ADMIN = {
  id: "admin-001",
  name: "Support Admin",
};

// Mock users for admin to chat with
const MOCK_USERS: ChatUser[] = [
  {
    id: "user-001",
    displayName: "Rahul Sharma",
    email: "rahul@company.com",
    phone: "+919876543210", // Phone number for calls
    companyName: "Sharma Industries",
    hasActiveConversation: true,
    conversationId: "conv-001",
    unreadCount: 2,
  },
  {
    id: "user-002",
    displayName: "Priya Patel",
    email: "priya@business.com",
    phone: "+919123456789", // Phone number for calls
    companyName: "Patel Traders",
    hasActiveConversation: true,
    conversationId: "conv-002",
    unreadCount: 0,
  },
  {
    id: "user-003",
    displayName: "Amit Kumar",
    email: "amit@factory.com",
    phone: "+918765432109", // Phone number for calls
    companyName: "Kumar Manufacturing",
    hasActiveConversation: false,
    unreadCount: 0,
  },
];

// Mock conversations
const MOCK_CONVERSATIONS: ChatConversation[] = [
  {
    id: "conv-001",
    userId: "user-001",
    userName: "Rahul Sharma",
    userEmail: "rahul@company.com",
    userPhone: "+919876543210", // Phone for admin to call
    userCompany: "Sharma Industries",
    adminId: MOCK_ADMIN.id,
    adminName: MOCK_ADMIN.name,
    lastMessage: "Can you help me with my order?",
    lastMessageTime: new Date().toISOString(),
    unreadCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "conv-002",
    userId: "user-002",
    userName: "Priya Patel",
    userEmail: "priya@business.com",
    userPhone: "+919123456789", // Phone for admin to call
    userCompany: "Patel Traders",
    adminId: MOCK_ADMIN.id,
    adminName: MOCK_ADMIN.name,
    lastMessage: "Thank you for your help!",
    lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
    unreadCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock messages storage (in memory)
// Using fixed unique IDs to avoid duplicate key errors
const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  "conv-001": [
    {
      id: "mock-msg-conv1-001",
      conversationId: "conv-001",
      senderId: "user-001",
      senderName: "Rahul Sharma",
      senderRole: "user",
      content: "Hello, I need some help with my product catalog.",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: true,
    },
    {
      id: "mock-msg-conv1-002",
      conversationId: "conv-001",
      senderId: MOCK_ADMIN.id,
      senderName: MOCK_ADMIN.name,
      senderRole: "admin",
      content: "Hi Rahul! How can I assist you today?",
      timestamp: new Date(Date.now() - 7000000).toISOString(),
      read: true,
    },
    {
      id: "mock-msg-conv1-003",
      conversationId: "conv-001",
      senderId: "user-001",
      senderName: "Rahul Sharma",
      senderRole: "user",
      content: "Can you help me with my order?",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
    },
  ],
  "conv-002": [
    {
      id: "mock-msg-conv2-001",
      conversationId: "conv-002",
      senderId: "user-002",
      senderName: "Priya Patel",
      senderRole: "user",
      content: "I had a question about pricing.",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      read: true,
    },
    {
      id: "mock-msg-conv2-002",
      conversationId: "conv-002",
      senderId: MOCK_ADMIN.id,
      senderName: MOCK_ADMIN.name,
      senderRole: "admin",
      content: "Sure! Our pricing depends on the quantity. What are you looking for?",
      timestamp: new Date(Date.now() - 80000000).toISOString(),
      read: true,
    },
    {
      id: "mock-msg-conv2-003",
      conversationId: "conv-002",
      senderId: "user-002",
      senderName: "Priya Patel",
      senderRole: "user",
      content: "Thank you for your help!",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: true,
    },
  ],
};

// Helper to generate unique IDs
let idCounter = 0;
const generateId = () => {
  idCounter += 1;
  return `id-${Date.now()}-${idCounter}-${Math.random().toString(36).substring(2, 11)}`;
};

// ============================================================
// CHAT SERVICE
// ============================================================

export const chatService = {
  // --------------------------------------------------------
  // ADMIN ENDPOINTS
  // --------------------------------------------------------

  /**
   * Get list of all users that admin can chat with
   * Admin uses this to see all users and start conversations
   */
  async getUsersForChat(): Promise<GetUsersForChatResponse> {
    // TODO: Replace with real API when backend is ready
    // return httpClient.get<GetUsersForChatResponse>("/admin/chat/users");

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
    return { users: MOCK_USERS };
  },

  /**
   * Get all conversations for admin
   */
  async getAdminConversations(): Promise<GetConversationsResponse> {
    // TODO: Replace with real API when backend is ready
    // return httpClient.get<GetConversationsResponse>("/admin/chat/conversations");

    await new Promise((resolve) => setTimeout(resolve, 500));
    return { conversations: MOCK_CONVERSATIONS };
  },

  /**
   * Start a new conversation with a user (admin only)
   */
  async startConversation(userId: string): Promise<StartConversationResponse> {
    // TODO: Replace with real API when backend is ready
    // return httpClient.post<StartConversationResponse>("/admin/chat/conversations", { userId });

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if conversation already exists
    const existingConv = MOCK_CONVERSATIONS.find((c) => c.userId === userId);
    if (existingConv) {
      return { conversation: existingConv };
    }

    // Create new conversation
    const user = MOCK_USERS.find((u) => u.id === userId);
    const newConversation: ChatConversation = {
      id: generateId(),
      userId,
      userName: user?.displayName || "Unknown User",
      userEmail: user?.email || "",
      userCompany: user?.companyName,
      adminId: MOCK_ADMIN.id,
      adminName: MOCK_ADMIN.name,
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    MOCK_CONVERSATIONS.push(newConversation);
    MOCK_MESSAGES[newConversation.id] = [];

    // Update user's conversation status
    const userIndex = MOCK_USERS.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      MOCK_USERS[userIndex].hasActiveConversation = true;
      MOCK_USERS[userIndex].conversationId = newConversation.id;
    }

    return { conversation: newConversation };
  },

  // --------------------------------------------------------
  // USER ENDPOINTS
  // --------------------------------------------------------

  /**
   * Get or create the user's conversation with admin
   * Users only have ONE conversation - with the admin
   */
  async getUserConversation(): Promise<{ conversation: ChatConversation | null }> {
    // TODO: Replace with real API when backend is ready
    // return httpClient.get<{ conversation: ChatConversation | null }>("/chat/my-conversation");

    await new Promise((resolve) => setTimeout(resolve, 500));

    // For demo, return the first conversation (pretend current user is user-001)
    const conversation = MOCK_CONVERSATIONS.find((c) => c.userId === "user-001") || null;
    return { conversation };
  },

  /**
   * Start a conversation with admin (user only)
   */
  async startConversationWithAdmin(): Promise<StartConversationResponse> {
    // TODO: Replace with real API when backend is ready
    // return httpClient.post<StartConversationResponse>("/chat/start");

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if user already has a conversation
    let conversation = MOCK_CONVERSATIONS.find((c) => c.userId === "user-001");

    if (!conversation) {
      conversation = {
        id: generateId(),
        userId: "user-001",
        userName: "Current User",
        userEmail: "user@example.com",
        adminId: MOCK_ADMIN.id,
        adminName: MOCK_ADMIN.name,
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_CONVERSATIONS.push(conversation);
      MOCK_MESSAGES[conversation.id] = [];
    }

    return { conversation };
  },

  // --------------------------------------------------------
  // SHARED ENDPOINTS (used by both admin and user)
  // --------------------------------------------------------

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, page = 1): Promise<GetMessagesResponse> {
    // TODO: Replace with real API when backend is ready
    // return httpClient.get<GetMessagesResponse>(`/chat/conversations/${conversationId}/messages`, { params: { page } });

    await new Promise((resolve) => setTimeout(resolve, 300));

    const messages = MOCK_MESSAGES[conversationId] || [];
    return {
      messages: messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
      hasMore: false,
    };
  },

  /**
   * Send a message in a conversation
   * Note: With Gifted Chat, the UI handles adding the message optimistically.
   * This function just simulates the API call.
   */
  async sendMessage(conversationId: string, content: string, senderRole: "admin" | "user"): Promise<SendMessageResponse> {
    // TODO: Replace with real API when backend is ready
    // return httpClient.post<SendMessageResponse>(`/chat/conversations/${conversationId}/messages`, { content });

    await new Promise((resolve) => setTimeout(resolve, 200));

    const newMessage: ChatMessage = {
      id: generateId(),
      conversationId,
      senderId: senderRole === "admin" ? MOCK_ADMIN.id : "user-001",
      senderName: senderRole === "admin" ? MOCK_ADMIN.name : "Current User",
      senderRole,
      content,
      timestamp: new Date().toISOString(),
      read: false,
    };

    // NOTE: We don't add to MOCK_MESSAGES here because:
    // 1. Gifted Chat handles the UI optimistically
    // 2. Adding here would cause duplicates when reloading
    // In a real app, the backend would store the message.

    // Update last message in conversation (for the list view)
    const convIndex = MOCK_CONVERSATIONS.findIndex((c) => c.id === conversationId);
    if (convIndex !== -1) {
      MOCK_CONVERSATIONS[convIndex].lastMessage = content;
      MOCK_CONVERSATIONS[convIndex].lastMessageTime = newMessage.timestamp;
      MOCK_CONVERSATIONS[convIndex].updatedAt = newMessage.timestamp;
    }

    return { message: newMessage };
  },

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    // TODO: Replace with real API when backend is ready
    // return httpClient.post(`/chat/conversations/${conversationId}/read`);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Mark all messages as read
    if (MOCK_MESSAGES[conversationId]) {
      MOCK_MESSAGES[conversationId] = MOCK_MESSAGES[conversationId].map((m) => ({
        ...m,
        read: true,
      }));
    }

    // Reset unread count
    const convIndex = MOCK_CONVERSATIONS.findIndex((c) => c.id === conversationId);
    if (convIndex !== -1) {
      MOCK_CONVERSATIONS[convIndex].unreadCount = 0;
    }
  },
};
