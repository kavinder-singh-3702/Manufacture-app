import React from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import { useTheme } from "../../../hooks/useTheme";

type LightCardTone = "white" | "soft";

export const LightCard = ({
  children,
  style,
  tone = "white",
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  tone?: LightCardTone;
}) => {
  const { radius, spacing, colors } = useTheme();
  const backgroundColor = tone === "soft" ? colors.surfaceLightSoft : colors.surfaceLight;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderColor: colors.border,
          shadowColor: colors.cardShadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 6,
  },
});
