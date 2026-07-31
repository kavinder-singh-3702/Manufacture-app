"use client";

import { motion } from "framer-motion";
import { PhoneCaptureBanner } from "./overview/PhoneCaptureBanner";
import { HeroAd } from "./overview/HeroAd";
import { StartBusinessCta } from "./overview/StartBusinessCta";
import { VerificationCta } from "./overview/VerificationCta";
import { QuickActionsGrid } from "./overview/QuickActionsGrid";
import { CategorySection } from "./overview/CategorySection";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] as const },
});

/**
 * Minimal, app-parity Overview — ad → business/verification CTAs → quick
 * actions → categories. Same block order and shape as the app's Home screen
 * (DashboardScreenContent.tsx) on mobile; widens via Tailwind breakpoints on
 * desktop rather than growing extra sections. Stats, verification detail,
 * and onboarding now live on their own pages (Company / Verification /
 * Profile) — see the dashboard plan for the full rationale.
 */
export const OverviewSection = () => (
  <div className="space-y-6">
    <motion.div {...fade(0)}>
      <PhoneCaptureBanner />
    </motion.div>

    <motion.div {...fade(0.05)}>
      <HeroAd />
    </motion.div>

    <motion.div {...fade(0.1)} className="grid gap-3 lg:grid-cols-2">
      <StartBusinessCta />
      <VerificationCta />
    </motion.div>

    <motion.div {...fade(0.15)}>
      <QuickActionsGrid />
    </motion.div>

    <motion.div {...fade(0.2)}>
      <CategorySection />
    </motion.div>
  </div>
);
