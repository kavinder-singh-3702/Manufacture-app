export const palette = {
  primary: "#1F3C88",
  primaryDark: "#162B63",
  secondary: "#F28705",
  accent: "#3ECF8E",
  critical: "#D64550",
  background: "#F4F6FB",
  card: "#FFFFFF",
  border: "#E0E6F6",
  textDark: "#0F172A",
  textMuted: "#64748B",
} as const;

export const colors = {
  background: palette.background,
  surface: palette.card,
  card: palette.card,
  primary: palette.primary,
  secondary: palette.secondary,
  accent: palette.accent,
  critical: palette.critical,
  border: palette.border,
  text: palette.textDark,
  muted: palette.textMuted,
} as const;
