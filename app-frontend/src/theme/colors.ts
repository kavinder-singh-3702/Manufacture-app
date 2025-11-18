// Brand Color Palette - Mixed & Blended Theme
export const palette = {
  // Core brand colors
  charcoal: "#2E2E3A",      // Dark slate - primary dark, headers, dark text
  green: "#11A440",         // Vibrant green - success, CTAs, accent actions
  burgundy: "#3B1F2B",      // Deep burgundy - secondary dark, emphasis
  pink: "#FADADD",          // Soft pink - light backgrounds, highlights

  // Mixed variations - Charcoal blends
  charcoalLight: "#434355",     // Charcoal + 20% white
  charcoalMuted: "#3A3A48",     // Charcoal + hint of pink
  charcoalGreen: "#2A3B37",     // Charcoal + green undertone
  charcoalBurgundy: "#342935",  // Charcoal + burgundy mix

  // Mixed variations - Green blends
  greenLight: "#5BC474",        // Green + white (40%)
  greenSoft: "#B8E6C3",         // Green + pink (soft pastel)
  greenDark: "#0D7D31",         // Green + charcoal (darker)
  greenBurgundy: "#2A6B3B",     // Green + burgundy hint

  // Mixed variations - Burgundy blends
  burgundyLight: "#4D2838",     // Burgundy + 20% white
  burgundySoft: "#8B6575",      // Burgundy + pink blend
  burgundyRose: "#6B3D4D",      // Burgundy + more pink
  burgundyDark: "#2A1720",      // Burgundy + charcoal

  // Mixed variations - Pink blends
  pinkLight: "#FCF0F1",         // Very light pink (95% white)
  pinkCharcoal: "#E5C9CE",      // Pink + charcoal tint
  pinkBurgundy: "#F3C5CF",      // Pink + burgundy blend
  pinkGreen: "#E8F2EA",         // Pink + green (minty soft)
  pinkWarm: "#FFE4E8",          // Pink + warmth

  // Gradient endpoints (for mixed gradients)
  gradientGreenPink: "#8FD5A4",     // Green-to-Pink midpoint
  gradientCharcoalGreen: "#1F4C3D", // Charcoal-to-Green
  gradientBurgundyPink: "#9E6B80",  // Burgundy-to-Pink
  gradientCharcoalBurgundy: "#2F2432", // Charcoal-to-Burgundy

  // Neutral palette (with subtle color hints)
  white: "#FFFFFF",
  offWhite: "#F8F8FA",          // White + hint of pink
  warmWhite: "#FFF9FA",         // White + pink warmth
  lightGray: "#E5E5E8",         // Cool gray
  mediumGray: "#9999A1",        // Neutral gray
  darkGray: "#5A5A65",          // Gray with charcoal

  // Semantic colors (brand-aligned)
  success: "#11A440",           // Brand green
  successLight: "#B8E6C3",      // Green-pink soft
  error: "#DC2626",             // Standard error
  errorSoft: "#F3A5AB",         // Error + pink blend
  warning: "#F59E0B",           // Standard warning
  warningSoft: "#FFE8C5",       // Warning + pink
  info: "#3B82F6",              // Standard info
  infoSoft: "#C7DEFF",          // Info + pink hint
} as const;

export const colors = {
  // Layout colors - Mixed theme
  background: palette.pinkLight,          // Very light pink base
  backgroundWarm: palette.warmWhite,      // Warm white with pink hint
  backgroundMint: palette.pinkGreen,      // Minty soft (pink+green mix)
  surface: palette.white,                 // Pure white for cards
  surfaceElevated: palette.offWhite,      // Slightly tinted white
  card: palette.white,                    // Card background
  cardTinted: palette.pinkWarm,           // Card with warm pink tint
  overlay: "rgba(46, 46, 58, 0.8)",      // Dark charcoal overlay
  overlayLight: "rgba(250, 218, 221, 0.9)", // Light pink overlay

  // Brand colors - Primary (Green family)
  primary: palette.green,                 // Vibrant green
  primaryDark: palette.greenDark,         // Dark green
  primaryLight: palette.greenLight,       // Light green
  primarySoft: palette.greenSoft,         // Soft pastel green (green+pink)
  primaryOnDark: palette.greenLight,      // Green for dark backgrounds

  // Brand colors - Secondary (Burgundy family)
  secondary: palette.burgundy,            // Deep burgundy
  secondaryDark: palette.burgundyDark,    // Darker burgundy
  secondaryLight: palette.burgundyLight,  // Lighter burgundy
  secondarySoft: palette.burgundySoft,    // Soft burgundy (burgundy+pink)
  secondaryRose: palette.burgundyRose,    // Rosy burgundy

  // Brand colors - Accent (Pink family)
  accent: palette.pink,                   // Soft pink
  accentLight: palette.pinkLight,         // Very light pink
  accentWarm: palette.pinkWarm,           // Warm pink
  accentCharcoal: palette.pinkCharcoal,   // Pink with charcoal tint
  accentBurgundy: palette.pinkBurgundy,   // Pink with burgundy

  // Text colors - Charcoal family
  text: palette.charcoal,                 // Main text (charcoal)
  textLight: palette.charcoalLight,       // Light text
  textMuted: palette.charcoalMuted,       // Muted charcoal (pink hint)
  textSecondary: palette.mediumGray,      // Gray text
  textTertiary: palette.darkGray,         // Dark gray
  textInverse: palette.white,             // White on dark
  textOnPrimary: palette.white,           // White on green
  textOnSecondary: palette.white,         // White on burgundy
  textOnAccent: palette.charcoal,         // Charcoal on pink

  // Border colors - Mixed tones
  border: palette.lightGray,              // Light neutral border
  borderDark: palette.charcoalLight,      // Dark border
  borderPrimary: palette.greenLight,      // Green tinted border
  borderSecondary: palette.burgundySoft,  // Burgundy tinted border
  borderAccent: palette.pinkBurgundy,     // Pink-burgundy border

  // Gradient colors (for gradients/shadows)
  gradientGreenPink: palette.gradientGreenPink,         // Green→Pink
  gradientCharcoalGreen: palette.gradientCharcoalGreen, // Charcoal→Green
  gradientBurgundyPink: palette.gradientBurgundyPink,   // Burgundy→Pink
  gradientCharcoalBurgundy: palette.gradientCharcoalBurgundy, // Charcoal→Burgundy

  // Semantic colors - Brand-aligned
  success: palette.success,               // Green success
  successLight: palette.successLight,     // Soft green (green+pink)
  successBg: palette.greenSoft,           // Success background

  error: palette.error,                   // Red error
  errorLight: palette.errorSoft,          // Soft error (error+pink)
  errorBg: palette.errorSoft,             // Error background

  warning: palette.warning,               // Orange warning
  warningLight: palette.warningSoft,      // Soft warning
  warningBg: palette.warningSoft,         // Warning background

  info: palette.info,                     // Blue info
  infoLight: palette.infoSoft,            // Soft info
  infoBg: palette.infoSoft,               // Info background

  // Special mixed colors for components
  buttonPrimary: palette.green,                      // Primary button
  buttonPrimaryHover: palette.greenDark,             // Primary hover
  buttonSecondary: palette.burgundy,                 // Secondary button
  buttonSecondaryHover: palette.burgundyDark,        // Secondary hover
  buttonGhost: "transparent",                        // Ghost button
  buttonGhostHover: palette.pinkLight,               // Ghost hover (pink)

  // Badge/Tag colors (mixed palette)
  badgeSuccess: palette.greenSoft,        // Soft green badge
  badgeError: palette.errorSoft,          // Soft error badge
  badgeWarning: palette.warningSoft,      // Soft warning badge
  badgeInfo: palette.infoSoft,            // Soft info badge
  badgePrimary: palette.greenLight,       // Primary badge
  badgeSecondary: palette.burgundySoft,   // Secondary badge
  badgeNeutral: palette.pinkCharcoal,     // Neutral badge (pink+charcoal)

  // Legacy/backwards compatibility
  critical: palette.error,
  muted: palette.mediumGray,
} as const;
