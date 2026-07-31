"use client";

import { ActionBanner, PHONE_CAPTURE_TONE } from "@/src/components/ui/ActionBanner";
import { useDashboardContext } from "../context";

/**
 * Soft mobile-capture nudge for non-admin users who reached the dashboard
 * without a phone on file — the hard phone gate (PhoneGate) only fires once
 * per fresh social sign-in, so legacy accounts can fall through to here.
 * Mirrors the app's Home screen banner (DashboardScreenContent.tsx).
 */
export const PhoneCaptureBanner = () => {
  const { user } = useDashboardContext();
  const isAdmin = user.role === "admin" || user.role === "super-admin";

  if (user.phone || isAdmin) return null;

  return (
    <ActionBanner
      href="/dashboard/profile"
      emoji="📞"
      title="Add your mobile number"
      subtitle="Helps with support, recovery, and order coordination."
      tone={PHONE_CAPTURE_TONE}
    />
  );
};
