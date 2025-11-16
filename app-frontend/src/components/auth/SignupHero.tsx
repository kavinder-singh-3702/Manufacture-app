import { StyleSheet, Text, View } from "react-native";
import { Typography } from "../common/Typography";
import { useTheme } from "../../hooks/useTheme";
import { authSharedStyles } from "./styles";

type Highlight = {
  label: string;
  description: string;
};

const heroHighlights: Highlight[] = [
  { label: "2 min avg", description: "Setup time" },
  { label: "SOC 2 Type II", description: "Security posture" },
  { label: "24/5 ops desk", description: "Human support" },
];

type SignupHeroProps = {
  helperCopy: string;
};

export const SignupHero = ({ helperCopy }: SignupHeroProps) => {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={[
        authSharedStyles.borderedContainer,
        styles.container,
        {
          padding: spacing.lg,
          borderColor: colors.border,
          borderRadius: radius.lg,
          backgroundColor: colors.background,
          gap: spacing.sm,
        },
      ]}
    >
      <View
        style={[
          authSharedStyles.pillBadge,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
          },
        ]}
      >
        <Text style={[styles.badgeText, { color: colors.primary }]}>Premium onboarding</Text>
      </View>
      <Typography variant="subheading" style={{ marginTop: spacing.xs }}>
        Launch your workspace
      </Typography>
      <Text style={{ color: colors.muted, lineHeight: 20 }}>{helperCopy}</Text>
      <View style={[styles.highlightRow, { columnGap: spacing.sm, rowGap: spacing.sm }]}>
        {heroHighlights.map((highlight) => (
          <View
            key={highlight.label}
            style={[
              styles.highlightCard,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                padding: spacing.sm,
                borderRadius: radius.md,
              },
            ]}
          >
            <Text style={[authSharedStyles.highlightText, { color: colors.muted }]}>{highlight.description}</Text>
            <Text style={[authSharedStyles.highlightLabel, { color: colors.text }]}>{highlight.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  highlightRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  highlightCard: {
    borderWidth: 1,
    minWidth: 120,
  },
});
