import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps } from "react-native";
import { useTheme } from "../../hooks/useTheme";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = TouchableOpacityProps & {
  label: string;
  loading?: boolean;
  variant?: ButtonVariant;
};

export const Button = ({ label, loading, variant = "primary", disabled, style, ...rest }: ButtonProps) => {
  const { colors, radius, spacing } = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === "primary" ? colors.primary : variant === "secondary" ? colors.secondary : "transparent";
  const textColor = variant === "ghost" ? colors.primary : "#ffffff";

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
