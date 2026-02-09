import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (design reference - iPhone 11 Pro)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/**
 * Responsive width based on screen size
 * @param widthPercent - percentage of screen width (0-100)
 * @returns scaled width in pixels
 */
export const wp = (widthPercent: number): number => {
  const elemWidth = typeof widthPercent === 'number' ? widthPercent : parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * elemWidth) / 100);
};

/**
 * Responsive height based on screen size
 * @param heightPercent - percentage of screen height (0-100)
 * @returns scaled height in pixels
 */
export const hp = (heightPercent: number): number => {
  const elemHeight = typeof heightPercent === 'number' ? heightPercent : parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * elemHeight) / 100);
};

/**
 * Scale font size based on screen width
 * @param size - base font size
 * @returns scaled font size
 */
export const scaleFont = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Scale size (for padding, margins, dimensions) based on screen width
 * @param size - base size
 * @returns scaled size
 */
export const scale = (size: number): number => {
  const scaleRatio = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(size * scaleRatio);
};

/**
 * Moderate scale - less aggressive scaling
 * Good for fonts and spacing that shouldn't scale as dramatically
 * @param size - base size
 * @param factor - scaling factor (0-1), default 0.5
 * @returns moderately scaled size
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

/**
 * Vertical scale based on screen height
 * @param size - base size
 * @returns vertically scaled size
 */
export const verticalScale = (size: number): number => {
  const scaleRatio = SCREEN_HEIGHT / BASE_HEIGHT;
  return Math.round(size * scaleRatio);
};

/**
 * Check if device is a tablet
 * @returns true if device is a tablet
 */
export const isTablet = (): boolean => {
  const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  return (
    (SCREEN_WIDTH >= 600 && aspectRatio < 1.6) ||
    (SCREEN_HEIGHT >= 600 && aspectRatio > 0.625)
  );
};

/**
 * Get responsive breakpoint category
 * @returns breakpoint name
 */
export const getBreakpoint = (): 'small' | 'medium' | 'large' | 'xlarge' => {
  if (SCREEN_WIDTH < 360) return 'small'; // Small phones (iPhone SE)
  if (SCREEN_WIDTH < 768) return 'medium'; // Regular phones
  if (SCREEN_WIDTH < 1024) return 'large'; // Large phones/small tablets
  return 'xlarge'; // Tablets
};

/**
 * Get number of columns for grid layouts based on screen size
 * @param minItemWidth - minimum width for each item
 * @param maxColumns - maximum number of columns
 * @returns number of columns
 */
export const getGridColumns = (minItemWidth: number = 100, maxColumns: number = 4): number => {
  const columns = Math.floor(SCREEN_WIDTH / minItemWidth);
  return Math.min(Math.max(columns, 1), maxColumns);
};

/**
 * Get responsive padding/margin based on screen size
 * @param baseSize - base padding/margin size
 * @returns object with responsive spacing values
 */
export const getResponsiveSpacing = (baseSize: number = 16) => ({
  xs: scale(baseSize * 0.25),
  sm: scale(baseSize * 0.5),
  md: scale(baseSize),
  lg: scale(baseSize * 1.5),
  xl: scale(baseSize * 2),
  xxl: scale(baseSize * 3),
});

// Export screen dimensions for convenience
export const DIMENSIONS = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmallDevice: SCREEN_WIDTH < 360,
  isMediumDevice: SCREEN_WIDTH >= 360 && SCREEN_WIDTH < 768,
  isLargeDevice: SCREEN_WIDTH >= 768,
  isTablet: isTablet(),
  breakpoint: getBreakpoint(),
};
