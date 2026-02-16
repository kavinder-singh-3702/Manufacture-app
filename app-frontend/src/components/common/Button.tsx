import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../hooks/useTheme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "accent";

type ButtonProps = TouchableOpacityProps & {
  label: string;
  loading?: boolean;
  variant?: ButtonVariant;
};

export const Button = ({ label, loading, variant = "primary", disabled, style, ...rest }: ButtonProps) => {
  const { colors, radius, spacing, nativeGradients } = useTheme();
  const isDisabled = disabled || loading;

  if (variant === "primary" || variant === "accent") {
    const gradientColors = variant === "primary" ? nativeGradients.ctaPrimary : nativeGradients.heroCoral;
    const textColor = variant === "primary" ? colors.textOnPrimary : colors.textOnAccent;
    const shadowColor = variant === "primary" ? colors.primary : colors.accent;

    return (
      <TouchableOpacity
        {...rest}
        style={[{ opacity: isDisabled ? 0.6 : 1 }, style]}
        disabled={isDisabled}
        activeOpacity={0.84}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.button,
            {
              borderRadius: radius.md,
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.xl,
              shadowColor,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.34,
              shadowRadius: 12,
              elevation: 7,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={textColor} />
          ) : (
            <Text style={[styles.label, { color: textColor }]}>{label}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const backgroundColor = variant === "secondary" ? colors.buttonSecondary : colors.buttonGhost;
  const borderColor = variant === "secondary" ? colors.border : "transparent";
  const textColor = variant === "ghost" ? colors.primary : colors.text;

  return (
    <TouchableOpacity
      {...rest}
      style={[
        styles.button,
        {
          backgroundColor,
          borderRadius: radius.md,
          borderWidth: variant === "secondary" ? 1 : 0,
          borderColor,
          opacity: isDisabled ? 0.6 : 1,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.xl,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: variant === "secondary" ? 0.18 : 0,
          shadowRadius: 8,
          elevation: variant === "secondary" ? 4 : 0,
        },
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.72}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
