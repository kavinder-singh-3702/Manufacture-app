import { colors } from "./colors";
import { radius, spacing } from "./spacing";
import { typography } from "./typography";
import { gradients, shadows } from "./gradients";

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  gradients,
  shadows,
} as const;

export type Theme = typeof theme;
