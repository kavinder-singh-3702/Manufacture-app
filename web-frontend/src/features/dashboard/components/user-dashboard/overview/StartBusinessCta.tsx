"use client";

import { ActionBanner, BUSINESS_TONE } from "@/src/components/ui/ActionBanner";

/**
 * "Start your own business" CTA — matches the app's Home screen card (same
 * indigo BUSINESS_ACCENT gradient, same copy) and links to the existing
 * business-setup flow.
 */
export const StartBusinessCta = () => (
  <ActionBanner
    href="/dashboard/business-setup"
    emoji="🚀"
    title="Start your own business"
    subtitle="Tell us your idea — get launch support."
    tone={BUSINESS_TONE}
  />
);
