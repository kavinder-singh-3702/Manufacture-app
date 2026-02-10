import { ResolvedThemeMode, Theme } from "../../../../theme";

type NavigationTokens = {
  spacing: {
    xxs: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
  };
  topBar: {
    compactMinHeight: number;
    twoRowMinHeight: number;
    iconButtonSize: number;
    searchHeight: number;
    titleSize: number;
    subtitleSize: number;
  };
  footer: {
    iconSize: number;
    labelSize: number;
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

export const getNavigationTokens = (
  theme: Theme,
  resolvedMode: ResolvedThemeMode
): NavigationTokens => {
  const { colors, spacing } = theme;
  const isDark = resolvedMode === "dark";

  return {
    spacing: {
      xxs: 4,
      xs: spacing.xs,
      sm: spacing.sm,
      md: spacing.md,
      lg: spacing.lg,
    },
    topBar: {
      compactMinHeight: 64,
      twoRowMinHeight: 122,
      iconButtonSize: 44,
      searchHeight: 48,
      titleSize: 20,
      subtitleSize: 12,
    },
    footer: {
      iconSize: 24,
      labelSize: 12,
      indicatorWidth: 22,
      indicatorHeight: 3,
      horizontalPadding: spacing.xs,
      topPadding: spacing.sm,
      bottomPadding: spacing.xs,
    },
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
