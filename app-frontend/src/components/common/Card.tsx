import { ReactNode } from "react";
import { View, StyleProp, ViewStyle, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../hooks/useTheme";

type CardVariant = "default" | "elevated" | "highlighted" | "accent";

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
};

export const Card = ({ children, style, variant = "default" }: CardProps) => {
  const { colors, radius, spacing, nativeGradients } = useTheme();

  const getCardStyles = () => {
    switch (variant) {
      case "elevated":
        return {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.borderPrimary,
          shadowColor: colors.primary,
          shadowOpacity: 0.14,
        };
      case "highlighted":
        return {
          backgroundColor: colors.badgePrimary,
          borderColor: colors.borderPrimary,
          shadowColor: colors.primary,
          shadowOpacity: 0.2,
        };
      case "accent":
        return {
          backgroundColor: colors.surfaceOverlayAccent,
          borderColor: colors.borderAccent,
          shadowColor: colors.accent,
          shadowOpacity: 0.18,
        };
      default:
        return {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOpacity: 0.2,
        };
    }
  };

  const cardStyles = getCardStyles();

  if (variant === "highlighted") {
    return (
      <View style={[styles.cardWrapper, style]}>
        <LinearGradient
          colors={nativeGradients.accentDiagonal}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.card,
            {
              borderRadius: radius.md,
              padding: 1,
            },
          ]}
        >
          <View
            style={{
              backgroundColor: cardStyles.backgroundColor,
              borderRadius: radius.md - 1,
              padding: spacing.lg,
              flex: 1,
            }}
          >
            <LinearGradient
              colors={[colors.surfaceOverlayPrimary, "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: radius.md - 1 }]}
            />
            {children}
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardStyles.backgroundColor,
          borderRadius: radius.md,
          borderColor: cardStyles.borderColor,
          padding: spacing.lg,
          shadowColor: cardStyles.shadowColor,
          shadowOpacity: cardStyles.shadowOpacity,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
    overflow: "hidden",
  },
});
