"use client";

import {
  ActionBanner,
  VERIFICATION_TONE_ACTION,
  VERIFICATION_TONE_PENDING,
  VERIFICATION_TONE_REJECTED,
  VERIFICATION_TONE_VERIFIED,
} from "@/src/components/ui/ActionBanner";
import { useDashboardContext } from "../context";

type VerificationStatus = "verified" | "pending" | "rejected" | "unverified";

const STATUS_COPY: Record<VerificationStatus, { emoji: string; title: string; subtitle: string }> = {
  verified: {
    emoji: "✅",
    title: "Company verified",
    subtitle: "Your trust badge is active — view details.",
  },
  pending: {
    emoji: "⏳",
    title: "Verification in review",
    subtitle: "Compliance is checking your documents.",
  },
  rejected: {
    emoji: "⚠️",
    title: "Resubmit documents",
    subtitle: "Your last submission needs attention.",
  },
  unverified: {
    emoji: "🛡️",
    title: "Get verified — 2 min",
    subtitle: "Unlock priority ranking & private RFQs.",
  },
};

const STATUS_TONE: Record<VerificationStatus, typeof VERIFICATION_TONE_ACTION> = {
  verified: VERIFICATION_TONE_VERIFIED,
  pending: VERIFICATION_TONE_PENDING,
  rejected: VERIFICATION_TONE_REJECTED,
  unverified: VERIFICATION_TONE_ACTION,
};

/**
 * Compact, status-aware CTA that replaces the old full verification banner
 * (benefits grid, status card, etc.) on Overview — the detail lives on its
 * own page now. Mirrors the app's Home screen verification pill/card.
 */
export const VerificationCta = () => {
  const { activeCompany } = useDashboardContext();
  const complianceRaw = (activeCompany?.complianceStatus ?? "").toLowerCase();
  const status: VerificationStatus =
    complianceRaw === "verified" || complianceRaw === "approved" || complianceRaw === "active"
      ? "verified"
      : complianceRaw === "pending"
        ? "pending"
        : complianceRaw === "rejected"
          ? "rejected"
          : "unverified";

  const copy = STATUS_COPY[status];

  return (
    <ActionBanner
      href="/dashboard/verification"
      emoji={copy.emoji}
      title={copy.title}
      subtitle={copy.subtitle}
      tone={STATUS_TONE[status]}
    />
  );
};
