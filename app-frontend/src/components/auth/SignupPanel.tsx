import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Typography } from "../common/Typography";
import { useTheme } from "../../hooks/useTheme";
import { authSharedStyles } from "./styles";

type SignupPanelProps = {
  subtitle: string;
  description: string;
  status?: string | null;
  error?: string | null;
  children: ReactNode;
  footer?: ReactNode;
};

export const SignupPanel = ({ subtitle, description, status, error, children, footer }: SignupPanelProps) => {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={[
        authSharedStyles.borderedContainer,
        styles.container,
        {
          borderColor: colors.border,
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          padding: spacing.lg,
        },
      ]}
    >
      <View style={{ marginBottom: spacing.sm }}>
        <Typography variant="subheading">{subtitle}</Typography>
        <Text style={{ color: colors.muted, marginTop: spacing.xs }}>{description}</Text>
      </View>

      {status ? (
        <View
          style={[
            authSharedStyles.feedbackContainer,
            { borderColor: colors.accent, backgroundColor: colors.background },
          ]}
        >
          <Text style={[styles.feedbackText, { color: colors.accent }]}>{status}</Text>
        </View>
      ) : null}
      {error ? (
        <View
          style={[
            authSharedStyles.feedbackContainer,
            { borderColor: colors.critical, backgroundColor: "#FFF5F5" },
          ]}
        >
          <Text style={[styles.feedbackText, { color: colors.critical }]}>{error}</Text>
        </View>
      ) : null}

      <View>{children}</View>

      {footer ? <View style={{ marginTop: spacing.md }}>{footer}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  feedbackText: {
    fontWeight: "600",
  },
});
