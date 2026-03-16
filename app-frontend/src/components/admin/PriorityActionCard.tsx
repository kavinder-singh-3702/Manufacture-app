import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import type { AdminOpsRequest } from "../../services/admin.service";

type PriorityActionCardProps = {
  item: AdminOpsRequest;
  onReview?: (item: AdminOpsRequest) => void;
};

const getAccentColorKey = (item: AdminOpsRequest): "error" | "warning" | "primary" | "success" => {
  if (item.priority === "critical") return "error";
  if (item.status === "pending" || item.priority === "high") return "warning";
  return "primary";
};

const getStatusDisplay = (status: string, priority: string) => {
  if (priority === "critical") return { label: "CRITICAL", colorKey: "error" as const };
  if (status === "pending") return { label: "PENDING", colorKey: "warning" as const };
  if (status === "in_review" || status === "in_progress") return { label: status.toUpperCase().replace(/_/g, " "), colorKey: "primary" as const };
  if (status === "completed" || status === "launched") return { label: "COMPLETED", colorKey: "success" as const };
  if (status.includes("overdue")) return { label: "OVERDUE", colorKey: "error" as const };
  if (status === "new") return { label: "NEW", colorKey: "primary" as const };
  return { label: status.toUpperCase().replace(/_/g, " "), colorKey: "textMuted" as const };
};

export const PriorityActionCard = ({ item, onReview }: PriorityActionCardProps) => {
  const { colors, radius } = useTheme();

  const accentColor = colors[getAccentColorKey(item)];
  const statusDisplay = getStatusDisplay(item.status, item.priority);
  const statusColor = colors[statusDisplay.colorKey];

  const companyName = item.company?.displayName ?? "Unknown Company";
  const refCode = item.referenceCode ?? `TRD-${item.id.slice(-5).toUpperCase()}`;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1.5,
          borderColor: colors.border,
          borderLeftWidth: 4,
          borderLeftColor: accentColor,
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
          elevation: 3,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.refCode, { color: colors.textSecondary }]}>{refCode}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "18", borderWidth: 1, borderColor: statusColor + "30" }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusDisplay.label}
            </Text>
          </View>
        </View>

        <Text style={[styles.companyName, { color: colors.text }]} numberOfLines={1}>
          {companyName}
        </Text>

        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.title}
        </Text>
      </View>

      {onReview && (
        <TouchableOpacity
          onPress={() => onReview(item)}
          style={[styles.reviewButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.reviewText, { color: colors.textOnPrimary }]}>REVIEW</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 10,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  refCode: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "800",
  },
  description: {
    fontSize: 13,
    fontWeight: "500",
  },
  reviewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginLeft: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
