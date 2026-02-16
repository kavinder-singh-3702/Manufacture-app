import { useMemo } from "react";
import { PixelRatio, useWindowDimensions } from "react-native";
import { useTheme } from "./useTheme";
import { getResponsiveTier, type ResponsiveTier } from "../utils/responsive";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

const getTierValues = (tier: ResponsiveTier) => {
  if (tier === "xCompact") {
    return {
      contentPadding: 12,
      sectionGap: 10,
      cardRadius: 12,
      iconSize: 18,
      titleScale: 0.9,
      compactHeaderHeight: 58,
    };
  }
  if (tier === "compact") {
    return {
      contentPadding: 14,
      sectionGap: 12,
      cardRadius: 14,
      iconSize: 20,
      titleScale: 0.95,
      compactHeaderHeight: 60,
    };
  }
  if (tier === "large") {
    return {
      contentPadding: 20,
      sectionGap: 18,
      cardRadius: 18,
      iconSize: 24,
      titleScale: 1.05,
      compactHeaderHeight: 68,
    };
  }
  return {
    contentPadding: 16,
    sectionGap: 16,
    cardRadius: 16,
    iconSize: 22,
    titleScale: 1,
    compactHeaderHeight: 64,
  };
};

export const useResponsiveLayout = () => {
  const { width, height } = useWindowDimensions();
  const fontScale = PixelRatio.getFontScale();
  const { spacing, radius } = useTheme();
  const tier = getResponsiveTier(width, fontScale);
  const tierValues = getTierValues(tier);

  return useMemo(
    () => ({
      width,
      height,
      fontScale,
      tier,
      isXCompact: tier === "xCompact",
      isCompact: tier === "xCompact" || tier === "compact",
      contentPadding: tierValues.contentPadding,
      sectionGap: tierValues.sectionGap,
      cardRadius: clamp(tierValues.cardRadius, radius.sm, radius.xl),
      iconSize: tierValues.iconSize,
      titleScale: tierValues.titleScale,
      compactHeaderHeight: tierValues.compactHeaderHeight,
      spacing,
      clamp,
    }),
    [fontScale, height, radius.lg, radius.sm, radius.xl, spacing, tier, tierValues, width]
  );
};

export type ResponsiveLayout = ReturnType<typeof useResponsiveLayout>;
