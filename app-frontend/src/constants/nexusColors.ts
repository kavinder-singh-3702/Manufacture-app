/**
 * Nexus Command Admin Color Palette
 * Used by Command Center components for the industrial admin aesthetic.
 * These override the default theme colors specifically for admin screens.
 */
export const NEXUS = {
  // Core
  background: "#061212",
  surface: "#0a1d1d",
  surfaceLight: "#0f2828",
  primary: "#06f9f9",
  primaryMuted: "#06f9f980",
  primarySubtle: "#06f9f920",
  primaryBorder: "#06f9f91a",

  // Semantic
  amber: "#f9a825",
  amberSubtle: "#f9a82520",
  red: "#ff4d4d",
  redSubtle: "#ff4d4d20",
  green: "#00e676",
  greenSubtle: "#00e67620",
  slate: "#455a64",

  // Typography
  textHigh: "#ffffff",
  textMedium: "#b0bec5",
  textMuted: "#78909c",

  // Glass effect
  glassBackground: "rgba(10, 29, 29, 0.8)",
  glassBorder: "rgba(6, 249, 249, 0.1)",

  // Glow
  glowCyan: "rgba(6, 249, 249, 0.4)",
} as const;
