"use client";

import { useAuth } from "@/src/hooks/useAuth";
import { ChatContainer } from "./ChatContainer";

export const ChatPage = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="text-4xl">🔒</div>
        <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>Sign in to access chat</p>
        <p className="text-sm" style={{ color: "var(--medium-gray)" }}>You need to be logged in to view your messages.</p>
      </div>
    );
  }

  return <ChatContainer currentUserId={user.id} />;
};
