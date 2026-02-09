import { darkColors } from "./colors.dark";

// Keep key parity with dark colors to avoid undefined access during migration.
export const lightColors = {
  ...darkColors,

  // Layout colors
  background: "#F4F6FB",
  backgroundSecondary: "#FFFFFF",
  backgroundTertiary: "#EEF2FA",
  backgroundWarm: "#F8FAFF",
  backgroundMint: "#F2F6FF",
  surface: "#FFFFFF",
  surfaceElevated: "#F6F8FE",
  card: "#FFFFFF",
  cardTinted: "#F7F9FF",
  overlay: "rgba(13,18,28,0.16)",
  overlayLight: "rgba(13,18,28,0.10)",

  // Brand colors
  primary: "#6F85D7",
  primaryDark: "#5B72C8",
  primaryLight: "#93A9EE",
  primarySoft: "#CCD7FA",
  primaryOnDark: "#FFFFFF",
  primaryGradientStart: "#6F85D7",
  primaryGradientEnd: "#5B72C8",
  primaryGlow: "rgba(111,133,215,0.24)",

  // Secondary + accent
  secondary: "#E9EEF8",
  secondaryDark: "#DDE4F2",
  secondaryLight: "#F7FAFF",
  secondarySoft: "#E6ECF8",
  accent: "#D94A41",
  accentLight: "#EA6C63",
  accentWarm: "#E65B52",
  accentCharcoal: "#DCE3F0",
  accentBurgundy: "#C23E36",
  accentStrong: "#D94A41",
  accentDark: "#A7352E",

  // Text
  text: "#12151C",
  textPrimary: "#12151C",
  textLight: "#1D2432",
  textMuted: "#707A8F",
  textSecondary: "#566076",
  textTertiary: "#7E899F",
  textDisabled: "#A1A9BA",
  textInverse: "#0A0B0E",
  textOnPrimary: "#FFFFFF",
  textOnSecondary: "#12151C",
  textOnAccent: "#FFFFFF",

  textOnLightSurface: "#12151C",
  subtextOnLightSurface: "rgba(18,21,28,0.58)",
  textOnDarkSurface: "#FFFFFF",
  subtextOnDarkSurface: "rgba(255,255,255,0.74)",

  // Borders + icon
  border: "#D7DEEB",
  borderLight: "#E5EBF6",
  borderDark: "#CAD3E4",
  borderPrimary: "#6F85D7",
  borderSecondary: "#D7DEEB",
  borderAccent: "#D94A41",
  iconActive: "#6F85D7",
  iconInactive: "#7E899F",
  iconDisabled: "#A1A9BA",

  // Gradients + semantic
  gradientGreenPink: "#6F85D7",
  gradientCharcoalGreen: "#F4F6FB",
  gradientBurgundyPink: "#D94A41",
  gradientCharcoalBurgundy: "#EBEFF8",

  successBg: "#ECFDF3",
  errorBg: "#FFF1F2",
  warningBg: "#FFFAEB",
  infoBg: "#EFF3FF",

  // Buttons
  buttonPrimary: "#6F85D7",
  buttonPrimaryHover: "#5B72C8",
  buttonSecondary: "#E9EEF8",
  buttonSecondaryHover: "#DDE4F2",
  buttonGhost: "transparent",
  buttonGhostHover: "#F2F6FF",

  // Badges/Tags
  badgeSuccess: "rgba(34,197,94,0.12)",
  badgeError: "rgba(239,68,68,0.12)",
  badgeWarning: "rgba(245,158,11,0.14)",
  badgeInfo: "rgba(111,133,215,0.14)",
  badgePrimary: "rgba(111,133,215,0.14)",
  badgeSecondary: "#EDF2FA",
  badgeNeutral: "#E6ECF6",

  // Shadows
  shadow: "rgba(15,23,42,0.16)",
  shadowGlow: "rgba(111,133,215,0.20)",
  shadowFocus: "rgba(111,133,215,0.30)",

  // Theme-only utility tokens
  surfaceLight: "#FFFFFF",
  surfaceLightSoft: "#F7FAFF",
  surfaceCanvasStart: "#F4F7FF",
  surfaceCanvasMid: "#EDF2FC",
  surfaceCanvasEnd: "#E9EFFA",
  surfaceOverlayPrimary: "rgba(111,133,215,0.10)",
  surfaceOverlaySecondary: "rgba(111,133,215,0.08)",
  surfaceOverlayAccent: "rgba(217,74,65,0.10)",
  modalBackdrop: "rgba(10,15,25,0.35)",
  footerBackground: "#FFFFFF",
  footerBorder: "rgba(15,17,21,0.12)",
  footerActive: "#12151C",
  footerInactive: "#7E899F",
  sidebarGradientStart: "#FFFFFF",
  sidebarGradientMid: "#F7FAFF",
  sidebarGradientEnd: "#EDF3FC",
  sidebarBorder: "rgba(111,133,215,0.14)",
  cardShadow: "rgba(15,17,21,0.10)",
} as const;

export type LightColors = typeof lightColors;
