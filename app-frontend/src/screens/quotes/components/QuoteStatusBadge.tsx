import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { QuoteStatus } from "../../../services/quote.service";

const STATUS_LABELS: Record<QuoteStatus, string> = {
  pending: "Pending",
  quoted: "Quoted",
  accepted: "Accepted",
  rejected: "Rejected",
  cancelled: "Cancelled",
  expired: "Expired",
};

export const QuoteStatusBadge = ({ status }: { status: QuoteStatus }) => {
  const { colors, radius } = useTheme();

  const palette = {
    pending: { bg: colors.warning + "1A", border: colors.warning + "55", text: colors.warning },
    quoted: { bg: colors.primary + "1A", border: colors.primary + "55", text: colors.primary },
    accepted: { bg: colors.success + "1A", border: colors.success + "55", text: colors.success },
    rejected: { bg: colors.error + "1A", border: colors.error + "55", text: colors.error },
    cancelled: { bg: colors.textMuted + "1A", border: colors.textMuted + "55", text: colors.textMuted },
    expired: { bg: colors.textSecondary + "1A", border: colors.textSecondary + "55", text: colors.textSecondary },
  }[status];

  return (
    <View
      style={[
        styles.badge,
        {
          borderRadius: radius.pill,
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
      ]}
    >
      <Text style={[styles.text, { color: palette.text }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
