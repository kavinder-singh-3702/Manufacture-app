import { io, Socket } from "socket.io-client";
import { httpClient } from "./http-client";

/**
 * Web's counterpart to app-frontend/src/services/chatSocket.ts. The backend
 * (backend/src/socket/index.js) only accepts a bearer JWT on the socket
 * handshake — web-frontend authenticates purely by session cookie and
 * discards the JWT its /auth/login response includes, so until now the web
 * app had no credential to hand the socket and never opened a realtime
 * connection at all. `GET /auth/realtime-token` (works for either cookie or
 * bearer session) mints a short-lived token just for this handshake.
 *
 * This is the single realtime connection for the web app — notifications
 * today, other realtime features (e.g. chat) can subscribe to the same
 * socket instead of opening a second connection.
 */

export type NotificationSocketEvents = {
  "notification:new": (payload: unknown) => void;
};

let socket: Socket | null = null;
let connecting: Promise<Socket> | null = null;

const resolveSocketBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!apiUrl) return null;
  return apiUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");
};

const fetchRealtimeToken = async (): Promise<string> => {
  const response = await httpClient.get<{ token: string }>("/auth/realtime-token");
  return response.token;
};

export const getSocket = async (): Promise<Socket> => {
  if (socket?.connected) return socket;
  if (connecting) return connecting;

  connecting = (async () => {
    const baseUrl = resolveSocketBaseUrl();
    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_API_URL is required for realtime notifications.");
    }

    const token = await fetchRealtimeToken();

    if (!socket) {
      socket = io(baseUrl, {
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

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};
