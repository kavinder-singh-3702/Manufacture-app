import { Metadata } from "next";
import { Suspense } from "react";
import { ChatPageContent } from "./ChatPageContent";

export const metadata: Metadata = {
  title: "ARVANN — Chat",
  description: "Real-time conversations with buyers, suppliers and your team.",
};

// Full-bleed skeleton (mirrors ChatContainer's fixed-inset mobile layout) so
// the Suspense fallback doesn't flash the normal page chrome before
// useSearchParams() resolves.
const ChatSkeleton = () => (
  <div className="fixed inset-0 z-40 flex items-center justify-center lg:static lg:z-auto lg:h-[calc(100vh-140px)] lg:min-h-[560px] lg:rounded-2xl lg:border" style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}>
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: "var(--primary)" }} />
  </div>
);

export default function ChatPageRoute() {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatPageContent />
    </Suspense>
  );
}
