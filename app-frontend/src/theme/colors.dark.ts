// Brand Color Palette - ARVANN Blue & Forge Red Theme
export const palette = {
  // Core brand colors
  richBackground: "#0A0B0E",
  elevatedSurface: "#15171C",
  linesBorder: "#2B2F38",

  // Accent colors
  mutedSalmon: "#E3483E",
  coralGold: "#E3483E",
  royalIndigo: "#8CA5EF",
  aquaBlue: "#6F85D7",

  // Legacy support colors
  charcoal: "#15171C",
  charcoalGreen: "#1B1F26",
  charcoalBurgundy: "#1D1718",
  midnightBlue: "#0A0B0E",
  deepPlum: "#1B1E27",
  peach: "#E3483E",

  // Supporting tints/shades
  charcoalLight: "#2B2F38",
  charcoalMuted: "#1B1F26",
  plumLight: "#2A3042",
  plumSoft: "#8CA5EF",
  plumDark: "#0D0A12",
  peachLight: "#F06F65",
  peachWarm: "#EB5C52",
  peachSoft: "#E95349",

  // Blue palette (replacing green aliases)
  green: "#8CA5EF",
  greenLight: "#AFC0FA",
  greenDark: "#6F85D7",
  greenSoft: "#CBD6FF",

  // Red palette (replacing pink aliases)
  pink: "#E3483E",
  pinkLight: "#F06F65",
  pinkWarm: "#EB5C52",
  pinkGreen: "#1B1F26",
  pinkBurgundy: "#C93B33",

  // Burgundy aliases
  burgundy: "#8CA5EF",
  burgundyRose: "#AFC0FA",
  burgundySoft: "#CBD6FF",

  // Neutral palette
  white: "#FFFFFF",
  offWhite: "#E9ECF7",
  warmWhite: "#F1F4FB",
  lightGray: "#9AA1B3",
  mediumGray: "#737B8E",
  darkGray: "#465067",

  // Secondary palette
  secondaryLight: "#1B1F26",

  // Gradient palette
  gradientGreenPink: "#8CA5EF",
  gradientBurgundyPink: "#E3483E",
  gradientCharcoalGreen: "#1B1F26",
  gradientCharcoalBurgundy: "#1D1718",

  // Semantic
  success: "#4ADE80",
  successLight: "#86EFAC",
  error: "#FF6B6B",
  errorSoft: "#FF9B9B",
  warning: "#FBBF24",
  warningSoft: "#FDE68A",
  info: "#6F85D7",
  infoSoft: "#AFC0FA",
} as const;

export const darkColors = {
  // Layout colors
  background: "#0A0B0E",
  backgroundSecondary: "#15171C",
  backgroundTertiary: "#1B1F26",
  backgroundWarm: "#15171C",
  backgroundMint: "#15171C",
  surface: "#15171C",
  surfaceElevated: "#1B1F26",
  card: "#15171C",
  cardTinted: "#1B1F26",
  overlay: "rgba(10,11,14,0.87)",
  overlayLight: "rgba(10,11,14,0.62)",

  // Brand colors
  primary: "#8CA5EF",
  primaryDark: "#6F85D7",
  primaryLight: "#AFC0FA",
  primarySoft: "#CBD6FF",
  primaryOnDark: "#FFFFFF",
  primaryGradientStart: "#8CA5EF",
  primaryGradientEnd: "#6F85D7",
  primaryGlow: "rgba(140,165,239,0.35)",

  // Secondary
  secondary: "#15171C",
  secondaryDark: "#0A0B0E",
  secondaryLight: "#1B1F26",
  secondarySoft: "#2B2F38",
  secondaryRose: "#E3483E",

  // Accent
  accent: "#E3483E",
  accentLight: "#F06F65",
  accentWarm: "#EB5C52",
  accentCharcoal: "#2B2F38",
  accentBurgundy: "#C93B33",
  accentStrong: "#E3483E",
  accentDark: "#B8342D",

  // Text colors
  text: "#FFFFFF",
  textPrimary: "#FFFFFF",
  textLight: "#E9ECF7",
  textMuted: "#9AA1B3",
  textSecondary: "#CCD2E3",
  textTertiary: "#737B8E",
  textDisabled: "#525C70",
  textInverse: "#0A0B0E",
  textOnPrimary: "#FFFFFF",
  textOnSecondary: "#E9ECF7",
  textOnAccent: "#FFFFFF",

  // Explicit semantic text roles
  // In dark mode, "light surface" utility tokens should still map to dark-theme readable colors
  // to avoid mixed white-card UI when a screen uses shared surface helpers.
  textOnLightSurface: "#FFFFFF",
  subtextOnLightSurface: "rgba(233,236,247,0.74)",
  textOnDarkSurface: "#FFFFFF",
  subtextOnDarkSurface: "rgba(255,255,255,0.74)",

  // Border colors
  border: "#2B2F38",
  borderLight: "#465067",
  borderDark: "#1B1F26",
  borderPrimary: "#8CA5EF",
  borderSecondary: "#2B2F38",
  borderAccent: "#E3483E",

  // Icon colors
  iconActive: "#8CA5EF",
  iconInactive: "#737B8E",
  iconDisabled: "#525C70",

  // Gradient anchors
  gradientGreenPink: "#8CA5EF",
  gradientCharcoalGreen: "#15171C",
  gradientBurgundyPink: "#E3483E",
  gradientCharcoalBurgundy: "#0A0B0E",

  // Semantic colors
  success: "#4ADE80",
  successLight: "#86EFAC",
  successBg: "#15171C",

  error: "#FF6B6B",
  errorStrong: "#EF4444",
  errorLight: "#FF9B9B",
  errorBg: "#15171C",

  warning: "#FBBF24",
  warningStrong: "#F59E0B",
  warningLight: "#FDE68A",
  warningBg: "#15171C",

  info: "#6F85D7",
  infoLight: "#AFC0FA",
  infoBg: "#15171C",

  // Buttons
  buttonPrimary: "#8CA5EF",
  buttonPrimaryHover: "#6F85D7",
  buttonSecondary: "#1B1F26",
  buttonSecondaryHover: "#2B2F38",
  buttonGhost: "transparent",
  buttonGhostHover: "#15171C",

  // Badges/Tags
  badgeSuccess: "rgba(74,222,128,0.15)",
  badgeError: "rgba(255,107,107,0.15)",
  badgeWarning: "rgba(251,191,36,0.15)",
  badgeInfo: "rgba(111,133,215,0.15)",
  badgePrimary: "rgba(140,165,239,0.15)",
  badgeSecondary: "#1B1F26",
  badgeNeutral: "#2B2F38",

  // Shadows
  shadow: "rgba(0,0,0,0.45)",
  shadowGlow: "rgba(140,165,239,0.30)",
  shadowFocus: "rgba(140,165,239,0.45)",

  // Theme-only utility tokens
  surfaceLight: "#15171C",
  surfaceLightSoft: "#1B1F26",
  surfaceCanvasStart: "#0A0B0E",
  surfaceCanvasMid: "#11141A",
  surfaceCanvasEnd: "#0A0B0E",
  surfaceOverlayPrimary: "rgba(140,165,239,0.14)",
  surfaceOverlaySecondary: "rgba(140,165,239,0.08)",
  surfaceOverlayAccent: "rgba(227,72,62,0.12)",
  modalBackdrop: "rgba(0,0,0,0.55)",
  footerBackground: "#15171C",
  footerBorder: "rgba(255,255,255,0.12)",
  footerActive: "#FFFFFF",
  footerInactive: "#9AA1B3",
  sidebarGradientStart: "#15171C",
  sidebarGradientMid: "#11141A",
  sidebarGradientEnd: "#0A0B0E",
  sidebarBorder: "rgba(140,165,239,0.22)",
  cardShadow: "rgba(10,11,14,0.2)",

  // Legacy/backwards compatibility
  critical: "#FF6B6B",
  muted: "#737B8E",
} as const;

export type DarkColors = typeof darkColors;
