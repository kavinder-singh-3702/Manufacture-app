import { Dimensions, PixelRatio } from "react-native";

// Base dimensions (design reference - iPhone 11 Pro)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export type ResponsiveTier = "xCompact" | "compact" | "regular" | "large";

type MetricsInput = {
  width?: number;
  height?: number;
  fontScale?: number;
};

const getWindowMetrics = () => Dimensions.get("window");

const resolveWidth = (width?: number) =>
  Number.isFinite(width) ? Number(width) : getWindowMetrics().width;

const resolveHeight = (height?: number) =>
  Number.isFinite(height) ? Number(height) : getWindowMetrics().height;

const resolveFontScale = (fontScale?: number) =>
  Number.isFinite(fontScale) ? Number(fontScale) : PixelRatio.getFontScale();

export const getResponsiveTier = (width?: number, fontScale?: number): ResponsiveTier => {
  const w = resolveWidth(width);
  const fs = resolveFontScale(fontScale);
  if (w <= 330 || fs > 1.25) return "xCompact";
  if (w <= 360 || fs > 1.1) return "compact";
  if (w <= 430) return "regular";
  return "large";
};

/**
 * Responsive width based on screen size
 * @param widthPercent - percentage of screen width (0-100)
 * @param width - optional viewport width override
 */
export const wp = (widthPercent: number, width?: number): number => {
  const w = resolveWidth(width);
  const elemWidth = typeof widthPercent === "number" ? widthPercent : parseFloat(String(widthPercent));
  return PixelRatio.roundToNearestPixel((w * elemWidth) / 100);
};

/**
 * Responsive height based on screen size
 * @param heightPercent - percentage of screen height (0-100)
 * @param height - optional viewport height override
 */
export const hp = (heightPercent: number, height?: number): number => {
  const h = resolveHeight(height);
  const elemHeight = typeof heightPercent === "number" ? heightPercent : parseFloat(String(heightPercent));
  return PixelRatio.roundToNearestPixel((h * elemHeight) / 100);
};

/**
 * Scale font size based on screen width
 * @param size - base font size
 * @param width - optional viewport width override
 */
export const scaleFont = (size: number, width?: number): number => {
  const w = resolveWidth(width);
  const ratio = w / BASE_WIDTH;
  const newSize = size * ratio;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Scale size (for padding, margins, dimensions) based on screen width
 * @param size - base size
 * @param width - optional viewport width override
 */
export const scale = (size: number, width?: number): number => {
  const w = resolveWidth(width);
  const ratio = w / BASE_WIDTH;
  return Math.round(size * ratio);
};

/**
 * Moderate scale - less aggressive scaling
 * @param size - base size
 * @param factor - scaling factor (0-1), default 0.5
 * @param width - optional viewport width override
 */
export const moderateScale = (size: number, factor: number = 0.5, width?: number): number => {
  return size + (scale(size, width) - size) * factor;
};

/**
 * Vertical scale based on screen height
 * @param size - base size
 * @param height - optional viewport height override
 */
export const verticalScale = (size: number, height?: number): number => {
  const h = resolveHeight(height);
  const ratio = h / BASE_HEIGHT;
  return Math.round(size * ratio);
};

/**
 * Check if device is a tablet
 */
export const isTablet = (width?: number, height?: number): boolean => {
  const w = resolveWidth(width);
  const h = resolveHeight(height);
  const aspectRatio = h / w;
  return (w >= 600 && aspectRatio < 1.6) || (h >= 600 && aspectRatio > 0.625);
};

/**
 * Get responsive breakpoint category
 */
export const getBreakpoint = (width?: number): "small" | "medium" | "large" | "xlarge" => {
  const w = resolveWidth(width);
  if (w < 360) return "small";
  if (w < 768) return "medium";
  if (w < 1024) return "large";
  return "xlarge";
};

/**
 * Get number of columns for grid layouts based on screen size
 */
export const getGridColumns = (
  minItemWidth: number = 100,
  maxColumns: number = 4,
  width?: number
): number => {
  const w = resolveWidth(width);
  const columns = Math.floor(w / minItemWidth);
  return Math.min(Math.max(columns, 1), maxColumns);
};

/**
 * Get responsive padding/margin based on screen size
 */
export const getResponsiveSpacing = (baseSize: number = 16, width?: number) => ({
  xs: scale(baseSize * 0.25, width),
  sm: scale(baseSize * 0.5, width),
  md: scale(baseSize, width),
  lg: scale(baseSize * 1.5, width),
  xl: scale(baseSize * 2, width),
  xxl: scale(baseSize * 3, width),
});

export const getDimensionsSnapshot = (input: MetricsInput = {}) => {
  const width = resolveWidth(input.width);
  const height = resolveHeight(input.height);
  const fontScale = resolveFontScale(input.fontScale);
  return {
    width,
    height,
    fontScale,
    isSmallDevice: width < 360,
    isMediumDevice: width >= 360 && width < 768,
    isLargeDevice: width >= 768,
    isTablet: isTablet(width, height),
    breakpoint: getBreakpoint(width),
    tier: getResponsiveTier(width, fontScale),
  };
};

// Backward-compatible snapshot for legacy non-reactive usage paths.
export const DIMENSIONS = getDimensionsSnapshot();
