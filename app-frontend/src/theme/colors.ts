// Brand Color Palette - pulled from hero palette image
export const palette = {
  // Core brand colors
  charcoal: "#2E2E3A", // Charcoal
  charcoalGreen: "#2E3A2E", // Charcoal with green tint
  charcoalBurgundy: "#3A2E30", // Charcoal with burgundy tint
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

  // Green palette
  green: "#11A440",
  greenLight: "#4CAF50",
  greenDark: "#0D7A30",
  greenSoft: "#B8E6C3",

  // Pink palette
  pink: "#FADADD",
  pinkLight: "#FFF1EA",
  pinkWarm: "#FFE4E0",
  pinkGreen: "#E8F5E9",
  pinkBurgundy: "#F3C5D0",

  // Burgundy palette
  burgundy: "#8B2C4A",
  burgundyRose: "#A64760",
  burgundySoft: "#D4A5B5",

  // Neutral palette
  white: "#FFFFFF",
  offWhite: "#F8F8FA",
  warmWhite: "#FFF9FA",
  lightGray: "#E5E5E8",
  mediumGray: "#9999A1",
  darkGray: "#5A5A65",

  // Secondary palette
  secondaryLight: "#24314F",

  // Gradient palette
  gradientGreenPink: "#D4F5E0",
  gradientBurgundyPink: "#E8A8B8",
  gradientCharcoalGreen: "#3A4840",
  gradientCharcoalBurgundy: "#4A3840",

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
  // Layout colors - Premium Soft-Dark Theme
  background: "#1C1C1C",
  backgroundSecondary: "#262626",
  backgroundTertiary: "#2D2D2D",
  backgroundWarm: "#262626",
  backgroundMint: "#262626",
  surface: "#262626",
  surfaceElevated: "#2D2D2D",
  card: "#262626",
  cardTinted: "#2D2D2D",
  overlay: "rgba(28,28,28,0.7)",
  overlayLight: "rgba(28,28,28,0.5)",

  // Brand colors - Premium Subtle Purple
  primary: "#8B7BC4",
  primaryDark: "#6E5FA8",
  primaryLight: "#A08FD4",
  primarySoft: "#B5A8E0",
  primaryOnDark: "#FFFFFF",
  primaryGradientStart: "#9686CC",
  primaryGradientEnd: "#7869B3",
  primaryGlow: "rgba(139,123,196,0.25)",

  // Secondary
  secondary: "#262626",
  secondaryDark: "#1C1C1C",
  secondaryLight: "#343434",
  secondarySoft: "#3D3D3D",
  secondaryRose: "#262626",

  // Accent (Premium Subtle Purple tones)
  accent: "#8B7BC4",
  accentLight: "#9686CC",
  accentWarm: "#9080CC",
  accentCharcoal: "#7869B3",
  accentBurgundy: "#8B7BC4",
  accentStrong: "#9080CC",
  accentDark: "#7869B3",

  // Text colors - Premium Typography
  text: "#FFFFFF",
  textPrimary: "#FFFFFF",
  textLight: "#E9E9E9",
  textMuted: "#B4B4B4",
  textSecondary: "#E9E9E9",
  textTertiary: "#8A8A8A",
  textDisabled: "#787878",
  textInverse: "#1C1C1C",
  textOnPrimary: "#FFFFFF",
  textOnSecondary: "#E9E9E9",
  textOnAccent: "#FFFFFF",

  // Border colors - Premium Elevation
  border: "#3D3848",
  borderLight: "#44404F",
  borderDark: "#2A2A2A",
  borderPrimary: "#6E5FA8",
  borderSecondary: "#3D3848",
  borderAccent: "#8B7BC4",

  // Icon colors
  iconActive: "#9080CC",
  iconInactive: "#8A8A8A",
  iconDisabled: "#6C6C6C",

  // Gradient anchors - Premium
  gradientGreenPink: "#A388EE",
  gradientCharcoalGreen: "#262626",
  gradientBurgundyPink: "#262626",
  gradientCharcoalBurgundy: "#1C1C1C",

  // Semantic colors - Premium softer tones
  success: "#6BCF7F",
  successLight: "#8FE09D",
  successBg: "#262626",

  error: "#EF6B6B",
  errorStrong: "#E85555",
  errorLight: "#F78989",
  errorBg: "#262626",

  warning: "#F5D47E",
  warningStrong: "#F0C659",
  warningLight: "#F8E09C",
  warningBg: "#262626",

  info: "#7AC8F5",
  infoLight: "#9DD9F9",
  infoBg: "#262626",

  // Buttons - Premium
  buttonPrimary: "#8B7BC4",
  buttonPrimaryHover: "#7869B3",
  buttonSecondary: "#343434",
  buttonSecondaryHover: "#3D3D3D",
  buttonGhost: "transparent",
  buttonGhostHover: "#262626",

  // Badges/Tags - Premium
  badgeSuccess: "#262626",
  badgeError: "#262626",
  badgeWarning: "#262626",
  badgeInfo: "#262626",
  badgePrimary: "#262626",
  badgeSecondary: "#262626",
  badgeNeutral: "#262626",

  // Shadows - Premium
  shadow: "rgba(0,0,0,0.25)",
  shadowGlow: "rgba(139,123,196,0.20)",
  shadowFocus: "rgba(110,95,168,0.35)",

  // Legacy/backwards compatibility
  critical: "#EF6B6B",
  muted: "#A4A4A4",
} as const;
