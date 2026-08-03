"use client";

import { useSearchParams } from "next/navigation";
import { ChatPage } from "@/src/features/chat";

export const ChatPageContent = () => {
  const params = useSearchParams();
  return (
    <ChatPage
      initialConversationId={params.get("conversationId")}
      initialProductId={params.get("productId")}
    />
  );
};
