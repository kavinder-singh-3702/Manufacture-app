import { useMemo } from "react";
import { useResponsiveLayout } from "../../../hooks/useResponsiveLayout";

type InventoryDashboardLayoutTokens = {
  headerHeight: number;
  sectionGap: number;
  cardPadding: number;
  iconButtonSize: number;
  titleSize: number;
  subtitleSize: number;
  chipHeight: number;
  ctaHeight: number;
  compact: boolean;
  xCompact: boolean;
};

export const useInventoryDashboardLayout = (): InventoryDashboardLayoutTokens => {
  const { tier } = useResponsiveLayout();

  return useMemo(() => {
    if (tier === "xCompact") {
      return {
        headerHeight: 52,
        sectionGap: 10,
        cardPadding: 10,
        iconButtonSize: 34,
        titleSize: 19,
        subtitleSize: 11,
        chipHeight: 30,
        ctaHeight: 40,
        compact: true,
        xCompact: true,
      };
    }

    if (tier === "compact") {
      return {
        headerHeight: 56,
        sectionGap: 12,
        cardPadding: 12,
        iconButtonSize: 36,
        titleSize: 20,
        subtitleSize: 12,
        chipHeight: 32,
        ctaHeight: 42,
        compact: true,
        xCompact: false,
      };
    }

    if (tier === "large") {
      return {
        headerHeight: 64,
        sectionGap: 16,
        cardPadding: 16,
        iconButtonSize: 42,
        titleSize: 24,
        subtitleSize: 13,
        chipHeight: 38,
        ctaHeight: 48,
        compact: false,
        xCompact: false,
      };
    }

    return {
      headerHeight: 60,
      sectionGap: 14,
      cardPadding: 14,
      iconButtonSize: 40,
      titleSize: 22,
      subtitleSize: 12,
      chipHeight: 34,
      ctaHeight: 46,
      compact: false,
      xCompact: false,
    };
  }, [tier]);
};

export type { InventoryDashboardLayoutTokens };
