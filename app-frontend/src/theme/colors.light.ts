import { darkColors } from "./colors.dark";

// Light mode remains stable with compatibility-focused updates.
export const lightColors = {
  ...darkColors,

  // Layout
  background: "#F4F8FC",
  backgroundSecondary: "#FFFFFF",
  backgroundTertiary: "#ECF3FA",
  backgroundWarm: "#F7FBFF",
  backgroundMint: "#EFFAFF",
  surface: "#FFFFFF",
  surfaceElevated: "#F5F9FF",
  card: "#FFFFFF",
  cardTinted: "#F0F8FF",
  overlay: "rgba(9,16,26,0.15)",
  overlayLight: "rgba(9,16,26,0.10)",

  // Brand
  primary: "#148DB2",
  primaryDark: "#0D7696",
  primaryLight: "#2BAED6",
  primarySoft: "#C8EEF8",
  primaryOnDark: "#FFFFFF",
  primaryGradientStart: "#1FA7CE",
  primaryGradientEnd: "#2BAED6",
  primaryGlow: "rgba(31,167,206,0.2)",

  // Secondary + accent
  secondary: "#EAF2FA",
  secondaryDark: "#DEEAF7",
  secondaryLight: "#F6FAFF",
  secondarySoft: "#E7F0FA",
  accent: "#D5616D",
  accentLight: "#E97A86",
  accentWarm: "#E56F7B",
  accentCharcoal: "#DFEAF6",
  accentBurgundy: "#B44D58",
  accentStrong: "#D5616D",
  accentDark: "#97424B",
  accentEmber: "#E46A42",
  accentEmberLight: "#F18359",
  accentEmberSoft: "#FFD3C2",

  // Text
  text: "#0F1724",
  textPrimary: "#0F1724",
  textLight: "#18263A",
  textMuted: "#5F7189",
  textSecondary: "#41546D",
  textTertiary: "#6F819A",
  textDisabled: "#97A6BB",
  textInverse: "#05070C",
  textOnPrimary: "#FFFFFF",
  textOnSecondary: "#0F1724",
  textOnAccent: "#FFFFFF",

  textOnLightSurface: "#0F1724",
  subtextOnLightSurface: "rgba(15,23,36,0.62)",
  textOnDarkSurface: "#F4F7FF",
  subtextOnDarkSurface: "rgba(244,247,255,0.72)",

  // Borders + icon
  border: "#D4E1EF",
  borderLight: "#E4EDF7",
  borderDark: "#C6D7E9",
  borderPrimary: "#148DB2",
  borderSecondary: "#D4E1EF",
  borderAccent: "#D5616D",
  iconActive: "#148DB2",
  iconInactive: "#6F819A",
  iconDisabled: "#97A6BB",

  // Gradients + semantic backgrounds
  gradientGreenPink: "#1FA7CE",
  gradientCharcoalGreen: "#ECF3FA",
  gradientBurgundyPink: "#D5616D",
  gradientCharcoalBurgundy: "#E9F1FA",

  successBg: "rgba(51,211,154,0.12)",
  errorBg: "rgba(255,123,135,0.12)",
  warningBg: "rgba(247,185,85,0.14)",
  infoBg: "rgba(76,206,239,0.14)",

  // Buttons
  buttonPrimary: "#148DB2",
  buttonPrimaryHover: "#0D7696",
  buttonSecondary: "#EAF2FA",
  buttonSecondaryHover: "#DEEAF7",
  buttonGhost: "transparent",
  buttonGhostHover: "#EFF7FF",

  // Badges
  badgeSuccess: "rgba(51,211,154,0.14)",
  badgeError: "rgba(255,123,135,0.14)",
  badgeWarning: "rgba(247,185,85,0.16)",
  badgeInfo: "rgba(76,206,239,0.14)",
  badgePrimary: "rgba(31,167,206,0.14)",
  badgeSecondary: "#EDF4FB",
  badgeNeutral: "#E2ECF8",

  // Shadows
  shadow: "rgba(13,25,42,0.14)",
  shadowGlow: "rgba(31,167,206,0.18)",
  shadowFocus: "rgba(31,167,206,0.28)",

  // Utility
  surfaceLight: "#FFFFFF",
  surfaceLightSoft: "#F4F9FF",
  surfaceCanvasStart: "#F4F8FC",
  surfaceCanvasMid: "#EDF4FB",
  surfaceCanvasEnd: "#E8F0F9",
  surfaceOverlayPrimary: "rgba(20,141,178,0.10)",
  surfaceOverlaySecondary: "rgba(43,174,214,0.08)",
  surfaceOverlayAccent: "rgba(213,97,109,0.10)",
  surfaceOverlayEmber: "rgba(228,106,66,0.10)",
  ctaWarmStart: "#D5616D",
  ctaWarmEnd: "#E46A42",
  modalBackdrop: "rgba(9,16,26,0.36)",
  footerBackground: "#FFFFFF",
  footerBorder: "rgba(15,23,36,0.12)",
  footerActive: "#0F1724",
  footerInactive: "#6F819A",
  sidebarGradientStart: "#FFFFFF",
  sidebarGradientMid: "#F5FAFF",
  sidebarGradientEnd: "#EAF3FC",
  sidebarBorder: "rgba(20,141,178,0.14)",
  cardShadow: "rgba(15,23,36,0.08)",

  // Legacy alias
  critical: "#D5616D",
  muted: "#5F7189",
} as const;

export type LightColors = typeof lightColors;
