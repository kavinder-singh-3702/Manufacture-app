// Brand Color Palette - pulled from hero palette image
export const palette = {
  // Core brand colors
  charcoal: "#2E2E3A", // Charcoal
  midnightBlue: "#1A2440", // Midnight blue
  deepPlum: "#3B1F2B", // Deep plum
  peach: "#FADADD", // Peach

  // Supporting tints/shades
  charcoalLight: "#434355",
  charcoalMuted: "#3A3A48",
  plumLight: "#4D2838",
  plumSoft: "#8B6575",
  plumDark: "#2A1720",
  peachLight: "#FFF1EA",
  peachWarm: "#FFE4E0",
  peachSoft: "#FBD4C8",

  // Neutral palette
  white: "#FFFFFF",
  offWhite: "#F8F8FA",
  warmWhite: "#FFF9FA",
  lightGray: "#E5E5E8",
  mediumGray: "#9999A1",
  darkGray: "#5A5A65",

  // Semantic
  success: "#11A440",
  successLight: "#B8E6C3",
  error: "#DC2626",
  errorSoft: "#F3A5AB",
  warning: "#F59E0B",
  warningSoft: "#FFE8C5",
  info: "#3B82F6",
  infoSoft: "#C7DEFF",
} as const;

export const colors = {
  // Layout colors - light theme
  background: palette.peachLight,
  backgroundWarm: palette.warmWhite,
  backgroundMint: palette.peachWarm,
  surface: palette.white,
  surfaceElevated: palette.offWhite,
  card: palette.white,
  cardTinted: palette.peachWarm,
  overlay: "rgba(46, 46, 58, 0.8)",
  overlayLight: "rgba(250, 218, 221, 0.9)",

  // Brand colors - Primary (Peach-forward)
  primary: palette.peach,
  primaryDark: palette.peachSoft,
  primaryLight: palette.peachLight,
  primarySoft: palette.peachWarm,
  primaryOnDark: palette.charcoal,

  // Secondary (Midnight blue)
  secondary: palette.midnightBlue,
  secondaryDark: "#121a2d",
  secondaryLight: "#24314F",
  secondarySoft: "#2f3b57",
  secondaryRose: "#24314F",

  // Accent (Deep plum)
  accent: palette.deepPlum,
  accentLight: palette.plumLight,
  accentWarm: palette.plumSoft,
  accentCharcoal: palette.charcoalMuted,
  accentBurgundy: palette.deepPlum,

  // Text colors
  text: palette.charcoal,
  textLight: palette.charcoalLight,
  textMuted: palette.charcoalMuted,
  textSecondary: palette.mediumGray,
  textTertiary: palette.darkGray,
  textInverse: palette.white,
  textOnPrimary: palette.deepPlum,
  textOnSecondary: palette.white,
  textOnAccent: palette.white,

  // Border colors
  border: palette.lightGray,
  borderDark: palette.charcoalLight,
  borderPrimary: palette.peachSoft,
  borderSecondary: palette.secondaryLight,
  borderAccent: palette.deepPlum,

  // Gradient anchors (reuse for backgrounds/shadows)
  gradientGreenPink: palette.peach,
  gradientCharcoalGreen: palette.midnightBlue,
  gradientBurgundyPink: palette.deepPlum,
  gradientCharcoalBurgundy: palette.deepPlum,

  // Semantic colors
  success: palette.success,
  successLight: palette.successLight,
  successBg: palette.successLight,

  error: palette.error,
  errorLight: palette.errorSoft,
  errorBg: palette.errorSoft,

  warning: palette.warning,
  warningLight: palette.warningSoft,
  warningBg: palette.warningSoft,

  info: palette.info,
  infoLight: palette.infoSoft,
  infoBg: palette.infoSoft,

  // Buttons
  buttonPrimary: palette.peach,
  buttonPrimaryHover: palette.peachSoft,
  buttonSecondary: palette.deepPlum,
  buttonSecondaryHover: palette.plumDark,
  buttonGhost: "transparent",
  buttonGhostHover: palette.peachLight,

  // Badges/Tags
  badgeSuccess: palette.successLight,
  badgeError: palette.errorSoft,
  badgeWarning: palette.warningSoft,
  badgeInfo: palette.infoSoft,
  badgePrimary: palette.peachWarm,
  badgeSecondary: palette.secondaryLight,
  badgeNeutral: palette.charcoalLight,

  // Legacy/backwards compatibility
  critical: palette.error,
  muted: palette.mediumGray,
} as const;
