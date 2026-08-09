import type { Metadata } from "next";
import { SupportPage } from "@/src/features/marketing";
import { SUPPORT_PHONE_DISPLAY } from "@/src/lib/contact";

export const metadata: Metadata = {
  title: "Support — ARVANN",
  description: `Get help with your ARVANN workspace: FAQs, support channels, and concierge onboarding. Call ${SUPPORT_PHONE_DISPLAY}.`,
  alternates: { canonical: "/support" },
};

export default function Support() {
  return <SupportPage />;
}
