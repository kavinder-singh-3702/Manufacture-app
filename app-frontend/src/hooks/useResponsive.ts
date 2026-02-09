import { useWindowDimensions } from 'react-native';
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
  DIMENSIONS
} from '../utils/responsive';

/**
 * Custom hook for responsive dimensions and utilities
 * Provides reactive screen dimensions and scaling functions
 *
 * @example
 * const { width, scale, isSmallDevice } = useResponsive();
 * const cardWidth = width - scale(32); // Responsive width with padding
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  return {
    // Screen dimensions (reactive to orientation changes)
    width,
    height,

    // Scaling functions
    scale,
    moderateScale,
    verticalScale,
    scaleFont,
    wp,
    hp,

    // Grid utilities
    getGridColumns,

    // Spacing utilities
    spacing: getResponsiveSpacing(),

    // Device breakpoints
    breakpoint: getBreakpoint(),
    isSmallDevice: width < 360,
    isMediumDevice: width >= 360 && width < 768,
    isLargeDevice: width >= 768,
    isTablet: isTablet(),

    // Static dimensions (for StyleSheet.create)
    staticDimensions: DIMENSIONS,
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
  const columns = getGridColumns(minItemWidth, maxColumns);
  const itemWidth = Math.floor(width / columns);

  return {
    columns,
    itemWidth,
    gap: scale(8),
  };
};
