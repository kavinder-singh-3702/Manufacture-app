import { Metadata } from "next";
import { ComingSoon } from "@/src/features/dashboard";

export const metadata: Metadata = {
  title: "Manufacture Command — Chat",
  description: "Real-time conversations with buyers, suppliers and your team.",
};

export default function ChatPage() {
  return (
    <ComingSoon
      eyebrow="Chat"
      title="Real-time messaging is almost here"
      description="Talk to buyers, suppliers and teammates without leaving Manufacture Command — every quote and order keeps its own thread."
      icon="💬"
      accent="#D97706"
      bullets={[
        "Direct, group and order-scoped conversations",
        "File and image sharing with delivery receipts",
        "Automatic translation between Hindi and English",
      ]}
    />
  );
}
