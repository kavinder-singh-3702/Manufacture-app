"use client";

import { AdBanner } from "@/src/features/ads/components/AdBanner";

/**
 * Thin wrapper around the shared AdBanner, requesting the same two
 * placements the app's Home screen merges into one carousel (hero_banner +
 * dashboard_home) instead of showing only a single feed. Renders nothing
 * when there's no eligible ad — AdBanner already handles that.
 */
export const HeroAd = () => <AdBanner placement="hero_banner" extraPlacements={["dashboard_home"]} />;
