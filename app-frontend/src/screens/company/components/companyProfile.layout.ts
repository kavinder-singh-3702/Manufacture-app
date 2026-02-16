import { useMemo } from "react";
import { useResponsiveLayout } from "../../../hooks/useResponsiveLayout";

type CompanyProfileLayoutTokens = {
  headerHeight: number;
  sectionGap: number;
  cardPadding: number;
  iconButtonSize: number;
  titleSize: number;
  subtitleSize: number;
  chipHeight: number;
  ctaHeight: number;
  edgePadding: number;
  compact: boolean;
  xCompact: boolean;
};

export const useCompanyProfileLayout = (): CompanyProfileLayoutTokens => {
  const { tier, isCompact, isXCompact } = useResponsiveLayout();

  return useMemo(() => {
    if (tier === "xCompact") {
      return {
        headerHeight: 56,
        sectionGap: 10,
        cardPadding: 10,
        iconButtonSize: 34,
        titleSize: 16,
        subtitleSize: 11,
        chipHeight: 30,
        ctaHeight: 40,
        edgePadding: 12,
        compact: true,
        xCompact: true,
      };
    }

    if (tier === "compact") {
      return {
        headerHeight: 60,
        sectionGap: 12,
        cardPadding: 12,
        iconButtonSize: 36,
        titleSize: 17,
        subtitleSize: 12,
        chipHeight: 32,
        ctaHeight: 42,
        edgePadding: 14,
        compact: true,
        xCompact: false,
      };
    }

    if (tier === "large") {
      return {
        headerHeight: 68,
        sectionGap: 16,
        cardPadding: 16,
        iconButtonSize: 42,
        titleSize: 20,
        subtitleSize: 13,
        chipHeight: 38,
        ctaHeight: 48,
        edgePadding: 20,
        compact: false,
        xCompact: false,
      };
    }

    return {
      headerHeight: 64,
      sectionGap: 14,
      cardPadding: 14,
      iconButtonSize: 40,
      titleSize: 18,
      subtitleSize: 12,
      chipHeight: 34,
      ctaHeight: 44,
      edgePadding: 16,
      compact: false,
      xCompact: false,
    };
  }, [tier, isCompact, isXCompact]);
};

export type { CompanyProfileLayoutTokens };
