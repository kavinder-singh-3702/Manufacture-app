import type { Metadata } from "next";
import { SupportPage } from "@/src/features/marketing";

export const metadata: Metadata = {
  title: "Support — ARVANN",
  description: "Get help with your ARVANN workspace: FAQs, support channels, and concierge onboarding.",
  alternates: { canonical: "/support" },
};

export default function Support() {
  return <SupportPage />;
}
