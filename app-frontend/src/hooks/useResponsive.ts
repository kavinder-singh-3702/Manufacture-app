import { useWindowDimensions } from "react-native";
import {
  scale,
  moderateScale,
  verticalScale,
  scaleFont,
  wp,
  hp,
  getBreakpoint,
  getGridColumns,
  getResponsiveSpacing,
  isTablet,
  DIMENSIONS,
  getResponsiveTier,
  getDimensionsSnapshot,
} from "../utils/responsive";

/**
 * Custom hook for responsive dimensions and utilities
 * Provides reactive screen dimensions and scaling functions
 *
 * @example
 * const { width, scale, isSmallDevice } = useResponsive();
 * const cardWidth = width - scale(32); // Responsive width with padding
 */
export const useResponsive = () => {
  const { width, height, fontScale } = useWindowDimensions();

  return {
    // Screen dimensions (reactive to orientation changes)
    width,
    height,
    fontScale,

    // Scaling functions
    scale: (value: number) => scale(value, width),
    moderateScale: (value: number, factor?: number) => moderateScale(value, factor, width),
    verticalScale: (value: number) => verticalScale(value, height),
    scaleFont: (value: number) => scaleFont(value, width),
    wp: (percent: number) => wp(percent, width),
    hp: (percent: number) => hp(percent, height),

    // Grid utilities
    getGridColumns: (minItemWidth?: number, maxColumns?: number) =>
      getGridColumns(minItemWidth, maxColumns, width),

    // Spacing utilities
    spacing: getResponsiveSpacing(16, width),

    // Device breakpoints
    breakpoint: getBreakpoint(width),
    tier: getResponsiveTier(width, fontScale),
    isSmallDevice: width < 360,
    isMediumDevice: width >= 360 && width < 768,
    isLargeDevice: width >= 768,
    isTablet: isTablet(width, height),

    // Static dimensions (for StyleSheet.create)
    staticDimensions: DIMENSIONS,
    dimensions: getDimensionsSnapshot({ width, height, fontScale }),
  };
};

/**
 * Hook for responsive grid calculations
 * @param minItemWidth - minimum width per grid item
 * @param maxColumns - maximum number of columns
 * @returns grid layout information
 */
export const useResponsiveGrid = (minItemWidth: number = 100, maxColumns: number = 4) => {
  const { width } = useWindowDimensions();
  const columns = getGridColumns(minItemWidth, maxColumns, width);
  const itemWidth = Math.floor(width / columns);

  return {
    columns,
    itemWidth,
    gap: scale(8, width),
  };
};
