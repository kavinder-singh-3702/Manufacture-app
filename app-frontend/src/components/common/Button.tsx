import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps } from "react-native";
import { useTheme } from "../../hooks/useTheme";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = TouchableOpacityProps & {
  label: string;
  loading?: boolean;
  variant?: ButtonVariant;
};

export const Button = ({ label, loading, variant = "primary", disabled, style, ...rest }: ButtonProps) => {
  const { colors, radius, spacing, shadows } = useTheme();
  const isDisabled = disabled || loading;

  // Use mixed color theme
  const backgroundColor =
    variant === "primary"
      ? colors.text                // Charcoal as primary CTA
      : variant === "secondary"
      ? colors.accent              // Deep plum for alerts
      : colors.buttonGhost;        // Transparent

  const textColor =
    variant === "ghost"
      ? colors.text                 // Charcoal text on transparent
      : colors.textInverse;         // White on solid buttons

  // Add subtle shadow based on variant
  const shadowStyle = variant === "primary"
    ? shadows.mdDark
    : variant === "secondary"
    ? shadows.green
    : undefined;

  return (
    <TouchableOpacity
      {...rest}
      style={[
        styles.button,
        {
          backgroundColor,
          borderRadius: radius.pill,
          opacity: isDisabled ? 0.6 : 1,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          // Apply shadow (web-style shadow for RN)
          shadowColor: variant === "primary" ? colors.primary : variant === "secondary" ? colors.secondary : "transparent",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: variant !== "ghost" ? 0.3 : 0,
          shadowRadius: 6,
          elevation: variant !== "ghost" ? 4 : 0,  // Android
        },
        style,
      ]}
      disabled={isDisabled}
    >
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.label, { color: textColor }]}>{label}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
});
