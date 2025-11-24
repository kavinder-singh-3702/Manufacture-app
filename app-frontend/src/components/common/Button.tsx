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

  // Dark theme button colors - darker purple tones
  const backgroundColor =
    variant === "primary"
      ? colors.primary             // Darker purple as primary CTA
      : variant === "secondary"
      ? colors.secondary           // Dark secondary
      : colors.buttonGhost;        // Transparent

  const textColor =
    variant === "ghost"
      ? colors.text                 // White text on transparent
      : variant === "primary"
      ? colors.textOnPrimary        // White text on purple
      : colors.textOnSecondary;     // White on dark buttons

  // Add subtle shadow based on variant
  const shadowStyle = variant === "primary"
    ? shadows?.mdDark
    : variant === "secondary"
    ? shadows?.green
    : undefined;

  return (
    <TouchableOpacity
      {...rest}
      style={[
        styles.button,
        {
          backgroundColor,
          borderRadius: radius.md,
          opacity: isDisabled ? 0.6 : 1,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.xl,
          // Apply shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: variant !== "ghost" ? 0.3 : 0,
          shadowRadius: 8,
          elevation: variant !== "ghost" ? 6 : 0,  // Android
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
