import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import type { AdminOpsRequest } from "../../services/admin.service";

type PriorityActionCardProps = {
  item: AdminOpsRequest;
  onReview?: (item: AdminOpsRequest) => void;
};

const SERVICE_TYPE_ACCENT: Record<string, { color: string; emoji: string }> = {
  machine_repair: { color: "#D97706", emoji: "🔧" },
  worker: { color: "#059669", emoji: "👷" },
  transport: { color: "#2563EB", emoji: "🚚" },
  advertisement: { color: "#DC2626", emoji: "📢" },
};

const getAccentColor = (item: AdminOpsRequest): string => {
  if (item.serviceType && SERVICE_TYPE_ACCENT[item.serviceType]) {
    return SERVICE_TYPE_ACCENT[item.serviceType].color;
  }
  if (item.priority === "critical") return "#DC2626";
  if (item.priority === "high") return "#D97706";
  return "#2563EB";
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

  const accent = getAccentColor(item);
  const serviceInfo = item.serviceType ? SERVICE_TYPE_ACCENT[item.serviceType] : null;
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
          borderLeftWidth: 4,
          borderLeftColor: accent,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        },
      ]}
    >
      {/* Service type indicator */}
      {serviceInfo ? (
        <View style={[styles.typeIndicator, { backgroundColor: `${accent}12`, borderRadius: radius.md }]}>
          <Text style={styles.typeEmoji}>{serviceInfo.emoji}</Text>
        </View>
      ) : null}

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.refCode, { color: colors.textTertiary }]}>{refCode}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}14`, borderRadius: radius.pill }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusDisplay.label}
            </Text>
          </View>
        </View>

        <Text style={[styles.companyName, { color: colors.text }]} numberOfLines={1}>
          {companyName}
        </Text>

        <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={1}>
          {item.title}
        </Text>
      </View>

      {onReview && (
        <TouchableOpacity
          onPress={() => onReview(item)}
          style={[styles.reviewButton, { backgroundColor: accent, borderRadius: radius.pill }]}
          activeOpacity={0.85}
        >
          <Text style={styles.reviewText}>REVIEW</Text>
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
    gap: 12,
  },
  typeIndicator: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  typeEmoji: { fontSize: 18 },
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
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  companyName: {
    fontSize: 15,
    fontWeight: "800",
  },
  description: {
    fontSize: 13,
    fontWeight: "500",
  },
  reviewButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 4,
  },
  reviewText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
    color: "#FFFFFF",
  },
});
