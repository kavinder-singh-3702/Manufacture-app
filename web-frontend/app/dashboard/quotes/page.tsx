import { Metadata } from "next";
import { QuotesContainer } from "@/src/features/quotes";

export const metadata: Metadata = {
  title: "ARVANN — Quotes",
  description: "Send, receive and negotiate RFQs from a single workspace.",
};

export default function QuotesPage() {
  return <QuotesContainer />;
}
