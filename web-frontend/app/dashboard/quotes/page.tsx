import { Metadata } from "next";
import { ComingSoon } from "@/src/features/dashboard";

export const metadata: Metadata = {
  title: "Manufacture Command — Quotes",
  description: "Send, receive and negotiate RFQs from a single workspace.",
};

export default function QuotesPage() {
  return (
    <ComingSoon
      eyebrow="Quotes & RFQ"
      title="Request-for-quote workspace is coming"
      description="Send, receive and negotiate RFQs with vendors and buyers — keep every revision, attachment and comment in one thread."
      icon="📋"
      accent="#7C3AED"
      bullets={[
        "Structured RFQ templates with item-level pricing",
        "Threaded negotiations with revision history",
        "One-click convert to purchase orders or sales orders",
      ]}
    />
  );
}
