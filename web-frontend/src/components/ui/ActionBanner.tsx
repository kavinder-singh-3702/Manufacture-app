"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export type ActionBannerTone = {
  /** Diagonal gradient background, e.g. `["#312E81", "#0F0C45"]`. */
  gradient: readonly [string, string];
  /** Tinted glow used for the drop shadow — keeps each CTA visually distinct. */
  glow: string;
  /** Accent tint mixed into the decorative blob and icon chip border. */
  accent?: string;
};

/**
 * App-parity gradient call-to-action row — icon chip, title, subtitle, and a
 * circular arrow, on a diagonal gradient card with a soft decorative blob.
 * Mirrors the "Start your own business" card in the app's Home screen
 * (DashboardScreenContent.tsx) and its BUSINESS_ACCENT palette.
 *
 * One component backs every gradient CTA on the web dashboard (business
 * setup, verification, phone capture) instead of three near-identical
 * hand-rolled blocks.
 */
export const ActionBanner = ({
  href,
  emoji,
  title,
  subtitle,
  tone,
  badge,
  className = "",
}: {
  href: string;
  emoji: ReactNode;
  title: string;
  subtitle: string;
  tone: ActionBannerTone;
  /** Optional small pill rendered above the title, e.g. a status label. */
  badge?: ReactNode;
  className?: string;
}) => {
  const [from, to] = tone.gradient;

  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }} className={className}>
      <Link
        href={href}
        className="relative flex items-center gap-3 overflow-hidden rounded-2xl p-4 sm:p-5"
        style={{
          background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
          boxShadow: `0 8px 20px ${tone.glow}`,
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {/* Decorative blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full"
          style={{ backgroundColor: tone.accent ?? "rgba(255,255,255,0.14)", opacity: 0.35 }}
        />

        <span
          className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-xl sm:h-12 sm:w-12"
          style={{ backgroundColor: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)" }}
        >
          {emoji}
        </span>

        <div className="relative min-w-0 flex-1">
          {badge && <div className="mb-0.5">{badge}</div>}
          <p className="truncate text-sm font-bold text-white sm:text-[15px]">{title}</p>
          <p className="mt-0.5 truncate text-xs font-medium text-white/70">{subtitle}</p>
        </div>

        <span
          className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.96)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M13 6l6 6-6 6" stroke={from} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Link>
    </motion.div>
  );
};

/** BUSINESS_ACCENT — ported from app-frontend/src/screens/services/services.palette.ts */
export const BUSINESS_TONE: ActionBannerTone = {
  gradient: ["#312E81", "#0F0C45"],
  glow: "rgba(165, 180, 252, 0.35)",
  accent: "#A5B4FC",
};

export const VERIFICATION_TONE_PENDING: ActionBannerTone = {
  gradient: ["#B45309", "#78350F"],
  glow: "rgba(252, 211, 77, 0.30)",
  accent: "#FCD34D",
};

export const VERIFICATION_TONE_ACTION: ActionBannerTone = {
  gradient: ["#312E81", "#7C3AED"],
  glow: "rgba(124, 58, 237, 0.30)",
  accent: "#C4B5FD",
};

export const VERIFICATION_TONE_VERIFIED: ActionBannerTone = {
  gradient: ["#065F46", "#059669"],
  glow: "rgba(110, 231, 183, 0.30)",
  accent: "#6EE7B7",
};

export const PHONE_CAPTURE_TONE: ActionBannerTone = {
  gradient: ["#B45309", "#92400E"],
  glow: "rgba(252, 211, 77, 0.28)",
  accent: "#FCD34D",
};
