import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import type { AdminOverview } from "../../services/admin.service";

type PendingApprovalsBarProps = {
  overview: AdminOverview | null;
  onPress?: (type: string) => void;
};

type ApprovalItem = {
  key: string;
  label: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  colorKey: "error" | "warning" | "primary";
};

export const PendingApprovalsBar = ({ overview, onPress }: PendingApprovalsBarProps) => {
  const { colors, radius } = useTheme();

  const allItems: ApprovalItem[] = [
    {
      key: "verifications",
      label: "Verifications",
      count: overview?.stats?.verifications?.pending ?? 0,
      icon: "shield-checkmark" as const,
      colorKey: "error" as const,
    },
    {
      key: "orders",
      label: "Orders",
      count: overview?.servicesQueue?.pending ?? 0,
      icon: "receipt" as const,
      colorKey: "warning" as const,
    },
    {
      key: "messages",
      label: "Messages",
      count: overview?.communications?.conversationsLast24h ?? 0,
      icon: "chatbubble" as const,
      colorKey: "primary" as const,
    },
    {
      key: "overdue",
      label: "Overdue",
      count: overview?.servicesQueue?.overdue ?? 0,
      icon: "alert-circle" as const,
      colorKey: "error" as const,
    },
  ];
  const items = allItems.filter((item) => item.count > 0);

  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>NEEDS ATTENTION</Text>
      <View style={styles.grid}>
        {items.map((item) => {
          const color = colors[item.colorKey];
          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.7}
              onPress={() => onPress?.(item.key)}
              style={[
                styles.card,
                {
                  backgroundColor: color + "0C",
                  borderColor: color + "30",
                  borderRadius: radius.lg,
                },
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: color + "18" }]}>
                <Ionicons name={item.icon} size={18} color={color} />
              </View>
              <Text style={[styles.count, { color }]}>{item.count}</Text>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    width: "47%",
    padding: 14,
    borderWidth: 1.5,
    alignItems: "center",
    gap: 6,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  count: {
    fontSize: 24,
    fontWeight: "800",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
});
