import { io, Socket } from "socket.io-client";
import { tokenStorage } from "./tokenStorage";
import { SOCKET_BASE_URL } from "../config/api";
import type { ChatConversation, ChatMessage } from "../types/chat";

export type ChatMessageEvent = {
  conversationId: string;
  message: ChatMessage;
  conversation?: ChatConversation | null;
};

export type ChatReadEvent = {
  conversationId: string;
  conversation?: ChatConversation | null;
  readerId?: string;
};

export type ChatTypingEvent = {
  conversationId: string;
  userId: string;
  isTyping: boolean;
};

type ServerToClientEvents = {
  "chat:message": (payload: ChatMessageEvent) => void;
  "chat:read": (payload: ChatReadEvent) => void;
  "chat:typing": (payload: ChatTypingEvent) => void;
};

type ClientToServerEvents = {
  "chat:typing": (payload: { conversationId: string; isTyping: boolean }) => void;
};

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let connecting: Promise<Socket<ServerToClientEvents, ClientToServerEvents>> | null = null;

export const getChatSocket = async () => {
  if (socket?.connected) return socket;
  if (connecting) return connecting;

  connecting = (async () => {
    const token = await tokenStorage.getToken();
    if (!token) {
      throw new Error("Chat socket requires an auth token");
    }
    if (!socket) {
      socket = io(SOCKET_BASE_URL, {
        autoConnect: false,
        transports: ["websocket"],
      });
    }

    socket.auth = { token };
    socket.connect();

    return socket;
  })();

  try {
    return await connecting;
  } finally {
    connecting = null;
  }
};

/** Emits the ephemeral typing signal — no persistence, best-effort only. */
export const sendTyping = (conversationId: string, isTyping: boolean) => {
  if (socket?.connected) {
    socket.emit("chat:typing", { conversationId, isTyping });
  }
};

export const disconnectChatSocket = () => {
  if (socket) {
    socket.disconnect();
  }
  socket = null;
  connecting = null;
};
