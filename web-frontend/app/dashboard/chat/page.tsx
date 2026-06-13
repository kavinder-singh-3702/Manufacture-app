import { Metadata } from "next";
import { ChatPage } from "@/src/features/chat";

export const metadata: Metadata = {
  title: "ARVANN — Chat",
  description: "Real-time conversations with buyers, suppliers and your team.",
};

export default function ChatPageRoute() {
  return <ChatPage />;
}
