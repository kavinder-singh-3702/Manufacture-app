import { ResolvedThemeMode, Theme } from "../../../../theme";

export type FooterDensity = "regular" | "compact" | "xCompact";

type NavigationTokens = {
  spacing: {
    xxs: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
  };
  topBar: {
    density: FooterDensity;
    compactMinHeight: number;
    twoRowMinHeight: number;
    iconButtonSize: number;
    searchHeight: number;
    titleSize: number;
    subtitleSize: number;
    searchFontSize: number;
  };
  footer: {
    density: FooterDensity;
    iconSize: number;
    iconWrapSize: number;
    labelSize: number;
    labelLineHeight: number;
    labelMarginTop: number;
    labelMaxLines: 1 | 2;
    tabMinHeight: number;
    indicatorWidth: number;
    indicatorHeight: number;
    horizontalPadding: number;
    topPadding: number;
    bottomPadding: number;
  };
  colors: {
    topBarBackground: string;
    topBarBorder: string;
    topBarTitle: string;
    topBarSubtitle: string;
    topBarIcon: string;
    topBarIconBackground: string;
    topBarIconBorder: string;
    searchBackground: string;
    searchBorder: string;
    searchPlaceholder: string;
    searchText: string;
    footerBackground: string;
    footerBorder: string;
    footerActive: string;
    footerInactive: string;
    footerIndicator: string;
    unreadBadgeBackground: string;
    unreadBadgeText: string;
  };
};

type NavigationScreenMetrics = {
  viewportWidth?: number;
  fontScale?: number;
};

export const resolveFooterDensity = ({ viewportWidth, fontScale }: NavigationScreenMetrics): FooterDensity => {
  const width = Number.isFinite(viewportWidth) ? Number(viewportWidth) : 390;
  const scale = Number.isFinite(fontScale) ? Number(fontScale) : 1;

  if (width <= 330 || scale > 1.25) return "xCompact";
  if (width <= 360 || scale > 1.1) return "compact";
  return "regular";
};

export const getNavigationTokens = (
  theme: Theme,
  resolvedMode: ResolvedThemeMode,
  screenMetrics: NavigationScreenMetrics = {}
): NavigationTokens => {
  const { colors, spacing } = theme;
  const isDark = resolvedMode === "dark";
  const footerDensity = resolveFooterDensity(screenMetrics);

  const footerByDensity: Record<FooterDensity, NavigationTokens["footer"]> = {
    regular: {
      density: "regular",
      iconSize: 24,
      iconWrapSize: 28,
      labelSize: 12,
      labelLineHeight: 14,
      labelMarginTop: 4,
      labelMaxLines: 1,
      tabMinHeight: 52,
      indicatorWidth: 22,
      indicatorHeight: 3,
      horizontalPadding: spacing.xs,
      topPadding: spacing.sm,
      bottomPadding: spacing.xs,
    },
    compact: {
      density: "compact",
      iconSize: 22,
      iconWrapSize: 24,
      labelSize: 10.5,
      labelLineHeight: 12,
      labelMarginTop: 3,
      labelMaxLines: 2,
      tabMinHeight: 48,
      indicatorWidth: 20,
      indicatorHeight: 2.5,
      horizontalPadding: 4,
      topPadding: 6,
      bottomPadding: 4,
    },
    xCompact: {
      density: "xCompact",
      iconSize: 20,
      iconWrapSize: 22,
      labelSize: 9.5,
      labelLineHeight: 11,
      labelMarginTop: 2,
      labelMaxLines: 2,
      tabMinHeight: 46,
      indicatorWidth: 18,
      indicatorHeight: 2,
      horizontalPadding: 2,
      topPadding: 5,
      bottomPadding: 3,
    },
  };

  return {
    spacing: {
      xxs: 4,
      xs: spacing.xs,
      sm: spacing.sm,
      md: spacing.md,
      lg: spacing.lg,
    },
    topBar:
      footerDensity === "xCompact"
        ? {
            density: "xCompact",
            compactMinHeight: 58,
            twoRowMinHeight: 102,
            iconButtonSize: 38,
            searchHeight: 42,
            titleSize: 17,
            subtitleSize: 10.5,
            searchFontSize: 13,
          }
        : footerDensity === "compact"
          ? {
              density: "compact",
              compactMinHeight: 62,
              twoRowMinHeight: 112,
              iconButtonSize: 41,
              searchHeight: 45,
              titleSize: 18.5,
              subtitleSize: 11,
              searchFontSize: 14,
            }
          : {
              density: "regular",
              compactMinHeight: 64,
              twoRowMinHeight: 122,
              iconButtonSize: 44,
              searchHeight: 48,
              titleSize: 20,
              subtitleSize: 12,
              searchFontSize: 15,
            },
    footer: footerByDensity[footerDensity],
    colors: {
      topBarBackground: isDark ? colors.backgroundSecondary : colors.surface,
      topBarBorder: isDark ? colors.footerBorder : colors.borderLight,
      topBarTitle: colors.text,
      topBarSubtitle: colors.textMuted,
      topBarIcon: colors.text,
      topBarIconBackground: isDark ? colors.surfaceElevated : colors.surface,
      topBarIconBorder: colors.border,
      searchBackground: isDark ? colors.surface : colors.surfaceElevated,
      searchBorder: colors.border,
      searchPlaceholder: colors.textMuted,
      searchText: colors.text,
      footerBackground: isDark ? colors.backgroundSecondary : colors.footerBackground,
      footerBorder: isDark ? colors.footerBorder : colors.footerBorder,
      footerActive: colors.footerActive,
      footerInactive: colors.footerInactive,
      footerIndicator: colors.primary,
      unreadBadgeBackground: colors.accent,
      unreadBadgeText: colors.textOnAccent,
    },
  };
};
