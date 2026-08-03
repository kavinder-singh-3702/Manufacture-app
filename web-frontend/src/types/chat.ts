// Mirrors app-frontend/src/types/chat.ts — kept as a structural mirror of
// the same backend contract (backend/src/models/chatMessage.model.js /
// chatConversation.model.js). Change both together.

export type ChatAttachment = {
  url: string;
  /** MIME type — used to decide image vs generic file rendering. */
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

export type Pagination = { total: number; limit: number; offset: number; hasMore: boolean };

export type GetConversationsResponse = {
  conversations: ChatConversation[];
  pagination?: Pagination;
};
export type GetMessagesResponse = {
  messages: ChatMessage[];
  pagination: Pagination;
};
export type SendMessageResponse = { message: ChatMessage };
export type UnreadCountResponse = { count: number };

// ── Admin console types ────────────────────────────────────────────────────
// Mirrors what backend/src/modules/chat/services/chat.service.js's
// listConversationsAdmin / getConversationAdminById return.

export type AdminConversationParticipant = {
  id: string;
  role: string;
  lastReadAt: string | null;
  name: string;
  email?: string;
  phone?: string;
};

export type AdminLinkedServiceRequest = {
  id: string;
  title: string;
  status: string;
  priority: string;
  updatedAt: string;
};

export type AdminChatConversation = ChatConversation & {
  linkedServiceRequest?: AdminLinkedServiceRequest | null;
};

export type AdminChatConversationDetail = AdminChatConversation & {
  participants: AdminConversationParticipant[];
};

export type ListAdminConversationsResponse = {
  conversations: AdminChatConversation[];
  pagination: Pagination;
};

export type AdminCallLogEntry = {
  id: string;
  conversationId: string | null;
  caller: { id: string; displayName?: string; email?: string; role?: string } | null;
  callee: { id: string; displayName?: string; email?: string; role?: string } | null;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ListAdminCallLogsResponse = {
  callLogs: AdminCallLogEntry[];
  pagination: Pagination;
};
