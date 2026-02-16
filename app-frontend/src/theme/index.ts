import { darkColors } from "./colors.dark";
import { lightColors } from "./colors.light";
import { radius, spacing } from "./spacing";
import { typography } from "./typography";
import { gradients, shadows } from "./gradients";
import { getNativeGradients, ThemeGradientKey } from "./gradients.native";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedThemeMode = "light" | "dark";

const themes = {
  light: {
    colors: lightColors,
    spacing,
    radius,
    typography,
    gradients,
    nativeGradients: getNativeGradients("light"),
    shadows,
  },
  dark: {
    colors: darkColors,
    spacing,
    radius,
    typography,
    gradients,
    nativeGradients: getNativeGradients("dark"),
    shadows,
  },
} as const;

export const getTheme = (resolvedMode: ResolvedThemeMode) => themes[resolvedMode];

// Backward-compatible default export used by legacy code paths.
export const theme = getTheme("dark");

export type Theme = ReturnType<typeof getTheme>;
export type { ThemeGradientKey };
