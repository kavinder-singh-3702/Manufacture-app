import { io, Socket } from "socket.io-client";
import { tokenStorage } from "./tokenStorage";
import { API_BASE_URL } from "../config/api";
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

type ServerToClientEvents = {
  "chat:message": (payload: ChatMessageEvent) => void;
  "chat:read": (payload: ChatReadEvent) => void;
};

type ClientToServerEvents = Record<string, never>;

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let connecting: Promise<Socket<ServerToClientEvents, ClientToServerEvents>> | null = null;

const resolveSocketUrl = () => {
  const explicit = process.env.EXPO_PUBLIC_SOCKET_URL;
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  return API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "");
};

export const getChatSocket = async () => {
  if (socket?.connected) return socket;
  if (connecting) return connecting;

  connecting = (async () => {
    const token = await tokenStorage.getToken();
    if (!token) {
      throw new Error("Chat socket requires an auth token");
    }
    const url = resolveSocketUrl();

    if (!socket) {
      socket = io(url, {
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

export const disconnectChatSocket = () => {
  if (socket) {
    socket.disconnect();
  }
  socket = null;
  connecting = null;
};
