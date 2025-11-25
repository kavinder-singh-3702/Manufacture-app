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
  const { colors, radius, spacing } = useTheme();

  const getCardStyles = () => {
    switch (variant) {
      case "elevated":
        return {
          backgroundColor: "rgba(30, 33, 39, 0.95)",
          borderColor: "rgba(108, 99, 255, 0.2)",
          shadowColor: "#6C63FF",
          shadowOpacity: 0.15,
        };
      case "highlighted":
        return {
          backgroundColor: "rgba(108, 99, 255, 0.08)",
          borderColor: "rgba(108, 99, 255, 0.4)",
          shadowColor: "#6C63FF",
          shadowOpacity: 0.25,
        };
      case "accent":
        return {
          backgroundColor: "rgba(255, 140, 60, 0.08)",
          borderColor: "rgba(255, 140, 60, 0.3)",
          shadowColor: "#FF8C3C",
          shadowOpacity: 0.2,
        };
      default:
        return {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: "#000",
          shadowOpacity: 0.25,
        };
    }
  };

  const cardStyles = getCardStyles();

  // Highlighted variant gets a gradient border effect
  if (variant === "highlighted") {
    return (
      <View style={[styles.cardWrapper, style]}>
        <LinearGradient
          colors={["rgba(108, 99, 255, 0.3)", "rgba(74, 201, 255, 0.15)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.card,
            {
              borderRadius: radius.md,
              padding: 1, // Border width
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
            {/* Inner glow */}
            <LinearGradient
              colors={["rgba(108, 99, 255, 0.1)", "transparent"]}
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
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
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
