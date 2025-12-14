// Brand Color Palette - Luxury Indigo & Coral Theme
export const palette = {
  // Core brand colors - Luxury Indigo & Coral
  richBackground: "#0F1115", // Rich Background
  elevatedSurface: "#16181D", // Elevated Surface
  linesBorder: "#282D33", // Lines / Border

  // Accent colors
  mutedSalmon: "#FF8C3C", // Muted Salmon - Primary accent
  coralGold: "#FF8C3C", // Legacy alias for Muted Salmon
  royalIndigo: "#6C63FF", // Royal Indigo - Secondary accent
  aquaBlue: "#4AC9FF", // Aqua Blue - Tertiary accent

  // Legacy support colors
  charcoal: "#16181D",
  charcoalGreen: "#1A1D22",
  charcoalBurgundy: "#1D1A1B",
  midnightBlue: "#0F1115",
  deepPlum: "#1A1520",
  peach: "#FF8C3C",

  // Supporting tints/shades
  charcoalLight: "#282D33",
  charcoalMuted: "#1E2127",
  plumLight: "#2A2535",
  plumSoft: "#6C63FF",
  plumDark: "#0D0A12",
  peachLight: "#FFB07A",
  peachWarm: "#FFA05C",
  peachSoft: "#FF9548",

  // Indigo palette (replacing green)
  green: "#6C63FF",
  greenLight: "#8B84FF",
  greenDark: "#5248E6",
  greenSoft: "#A8A3FF",

  // Salmon palette (replacing pink)
  pink: "#FF8C3C",
  pinkLight: "#FFB07A",
  pinkWarm: "#FFA05C",
  pinkGreen: "#1E2127",
  pinkBurgundy: "#E87A30",

  // Burgundy palette (now indigo-tinted)
  burgundy: "#6C63FF",
  burgundyRose: "#8B84FF",
  burgundySoft: "#A8A3FF",

  // Neutral palette
  white: "#FFFFFF",
  offWhite: "#E8E9EC",
  warmWhite: "#F0F1F4",
  lightGray: "#9BA1AD",
  mediumGray: "#6B7280",
  darkGray: "#3D4450",

  // Secondary palette
  secondaryLight: "#1E2127",

  // Gradient palette
  gradientGreenPink: "#6C63FF",
  gradientBurgundyPink: "#FF8C3C",
  gradientCharcoalGreen: "#1A1D22",
  gradientCharcoalBurgundy: "#1D1A1B",

  // Semantic
  success: "#4ADE80",
  successLight: "#86EFAC",
  error: "#FF6B6B",
  errorSoft: "#FF9B9B",
  warning: "#FBBF24",
  warningSoft: "#FDE68A",
  info: "#4AC9FF",
  infoSoft: "#93DFFF",
} as const;

export const colors = {
  // Layout colors - Luxury Indigo & Coral Theme
  background: "#0F1115", // Rich Background
  backgroundSecondary: "#16181D", // Elevated Surface
  backgroundTertiary: "#1E2127",
  backgroundWarm: "#16181D",
  backgroundMint: "#16181D",
  surface: "#16181D", // Elevated Surface
  surfaceElevated: "#1E2127",
  card: "#16181D",
  cardTinted: "#1E2127",
  overlay: "rgba(15,17,21,0.85)",
  overlayLight: "rgba(15,17,21,0.6)",

  // Brand colors - Royal Indigo Primary
  primary: "#6C63FF", // Royal Indigo
  primaryDark: "#5248E6",
  primaryLight: "#8B84FF",
  primarySoft: "#A8A3FF",
  primaryOnDark: "#FFFFFF",
  primaryGradientStart: "#6C63FF", // Royal Indigo
  primaryGradientEnd: "#5248E6",
  primaryGlow: "rgba(108,99,255,0.35)",

  // Secondary - Coral Gold
  secondary: "#16181D",
  secondaryDark: "#0F1115",
  secondaryLight: "#1E2127",
  secondarySoft: "#282D33",
  secondaryRose: "#FF8C3C",

  // Accent - Muted Salmon & Aqua Blue
  accent: "#FF8C3C", // Muted Salmon
  accentLight: "#FFB07A",
  accentWarm: "#FFA05C",
  accentCharcoal: "#282D33",
  accentBurgundy: "#E87A30",
  accentStrong: "#FF8C3C",
  accentDark: "#D97428",

  // Text colors - Premium Typography
  text: "#FFFFFF",
  textPrimary: "#FFFFFF",
  textLight: "#E8E9EC",
  textMuted: "#9BA1AD",
  textSecondary: "#C5C9D2",
  textTertiary: "#6B7280",
  textDisabled: "#4D5563",
  textInverse: "#0F1115",
  textOnPrimary: "#FFFFFF",
  textOnSecondary: "#E8E9EC",
  textOnAccent: "#FFFFFF",

  // Border colors - Luxury Lines
  border: "#282D33", // Lines / Border
  borderLight: "#3D4450",
  borderDark: "#1E2127",
  borderPrimary: "#6C63FF",
  borderSecondary: "#282D33",
  borderAccent: "#FF8C3C",

  // Icon colors
  iconActive: "#6C63FF",
  iconInactive: "#6B7280",
  iconDisabled: "#4D5563",

  // Gradient anchors - Luxury
  gradientGreenPink: "#6C63FF",
  gradientCharcoalGreen: "#16181D",
  gradientBurgundyPink: "#FF8C3C",
  gradientCharcoalBurgundy: "#0F1115",

  // Semantic colors - Luxury vibrant tones
  success: "#4ADE80",
  successLight: "#86EFAC",
  successBg: "#16181D",

  error: "#FF6B6B",
  errorStrong: "#EF4444",
  errorLight: "#FF9B9B",
  errorBg: "#16181D",

  warning: "#FBBF24",
  warningStrong: "#F59E0B",
  warningLight: "#FDE68A",
  warningBg: "#16181D",

  info: "#4AC9FF", // Aqua Blue
  infoLight: "#93DFFF",
  infoBg: "#16181D",

  // Buttons - Luxury
  buttonPrimary: "#6C63FF",
  buttonPrimaryHover: "#5248E6",
  buttonSecondary: "#1E2127",
  buttonSecondaryHover: "#282D33",
  buttonGhost: "transparent",
  buttonGhostHover: "#16181D",

  // Badges/Tags - Luxury with subtle backgrounds
  badgeSuccess: "rgba(74,222,128,0.15)",
  badgeError: "rgba(255,107,107,0.15)",
  badgeWarning: "rgba(251,191,36,0.15)",
  badgeInfo: "rgba(74,201,255,0.15)",
  badgePrimary: "rgba(108,99,255,0.15)",
  badgeSecondary: "#1E2127",
  badgeNeutral: "#282D33",

  // Shadows - Luxury
  shadow: "rgba(0,0,0,0.4)",
  shadowGlow: "rgba(108,99,255,0.30)",
  shadowFocus: "rgba(108,99,255,0.45)",

  // Legacy/backwards compatibility
  critical: "#FF6B6B",
  muted: "#6B7280",
} as const;
