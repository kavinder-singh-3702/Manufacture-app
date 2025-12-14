import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../hooks/useTheme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "accent";

type ButtonProps = TouchableOpacityProps & {
  label: string;
  loading?: boolean;
  variant?: ButtonVariant;
};

export const Button = ({ label, loading, variant = "primary", disabled, style, ...rest }: ButtonProps) => {
  const { colors, radius, spacing } = useTheme();
  const isDisabled = disabled || loading;

  // Premium gradient button for primary variant
  if (variant === "primary") {
    return (
      <TouchableOpacity
        {...rest}
        style={[{ opacity: isDisabled ? 0.6 : 1 }, style]}
        disabled={isDisabled}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#6C63FF", "#5248E6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.button,
            {
              borderRadius: radius.md,
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.xl,
              shadowColor: "#6C63FF",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={[styles.label, { color: "#FFFFFF" }]}>{label}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Accent variant with Salmon gradient
  if (variant === "accent") {
    return (
      <TouchableOpacity
        {...rest}
        style={[{ opacity: isDisabled ? 0.6 : 1 }, style]}
        disabled={isDisabled}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#FF8C3C", "#E87A30"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.button,
            {
              borderRadius: radius.md,
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.xl,
              shadowColor: "#FF8C3C",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={[styles.label, { color: "#FFFFFF" }]}>{label}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Secondary and Ghost variants
  const backgroundColor =
    variant === "secondary"
      ? "rgba(30, 33, 39, 0.9)"
      : "transparent";

  const borderColor =
    variant === "secondary"
      ? "rgba(108, 99, 255, 0.3)"
      : "transparent";

  const textColor =
    variant === "ghost"
      ? colors.primary
      : colors.text;

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
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: variant === "secondary" ? 0.2 : 0,
          shadowRadius: 8,
          elevation: variant === "secondary" ? 4 : 0,
        },
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.7}
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
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
