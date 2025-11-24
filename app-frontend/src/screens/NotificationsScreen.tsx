import { useMemo, useState } from "react";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  category: "orders" | "compliance" | "system" | "billing" | "product";
  severity: "info" | "warning" | "critical" | "success";
  status: "unread" | "read";
  actor?: string;
  tags?: string[];
  actionLabel?: string;
};

const now = Date.now();

const mockNotifications: NotificationItem[] = [
  {
    id: "n-001",
    title: "Dispatch slot confirmed",
    body: "Trucking partner assigned for PO-2239. Driver ETA 45 mins; manifest locked.",
    timestamp: new Date(now - 15 * 60 * 1000).toISOString(),
    category: "orders",
    severity: "success",
    status: "unread",
    actor: "Logistics Desk",
    tags: ["Dispatch", "PO-2239"],
    actionLabel: "View manifest",
  },
  {
    id: "n-002",
    title: "Compliance doc expiring",
    body: "GST certificate for Goyal Metals expires in 5 days. Upload the renewed copy to avoid delays.",
    timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    category: "compliance",
    severity: "warning",
    status: "unread",
    actor: "Compliance Bot",
    tags: ["Compliance", "GST"],
    actionLabel: "Upload now",
  },
  {
    id: "n-003",
    title: "Quality check failed",
    body: "Batch #204 failed torque test at station A3. Review deviation notes and re-run inspection.",
    timestamp: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
    category: "product",
    severity: "critical",
    status: "read",
    actor: "QA Station A3",
    tags: ["QA", "Batch #204"],
    actionLabel: "View report",
  },
  {
    id: "n-004",
    title: "Invoice ready",
    body: "Invoice INV-7781 generated for order #1189. Amount: ₹6,40,000. Due in 7 days.",
    timestamp: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
    category: "billing",
    severity: "info",
    status: "read",
    actor: "Billing",
    tags: ["Invoice", "Order #1189"],
    actionLabel: "Download PDF",
  },
  {
    id: "n-005",
    title: "System maintenance window",
    body: "Planned downtime on Saturday, 22:00–23:00 IST. Live tracking will be paused.",
    timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: "system",
    severity: "info",
    status: "read",
    actor: "Platform",
    tags: ["System", "Maintenance"],
  },
];

const severityPalette: Record<NotificationItem["severity"], { dot: string; text: string; bg: string }> = {
  info: { dot: "#4338ca", text: "#4338ca", bg: "rgba(67,56,202,0.08)" },
  warning: { dot: "#b45309", text: "#b45309", bg: "rgba(180,83,9,0.1)" },
  critical: { dot: "#b4234d", text: "#b4234d", bg: "rgba(180,35,77,0.12)" },
  success: { dot: "#166534", text: "#166534", bg: "rgba(22,101,52,0.12)" },
};

export const NotificationsScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<NotificationItem[]>(mockNotifications);
  const unreadCount = useMemo(() => items.filter((item) => item.status === "unread").length, [items]);

  const markAllRead = () => setItems((prev) => prev.map((item) => ({ ...item, status: "read" })));
  const markItemRead = (id: string) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: "read" } : item)));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.backButton,
            { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md },
          ]}
        >
          <Text style={{ fontSize: 18, color: colors.text }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>Notifications</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>Workspace updates and alerts</Text>
        </View>
        <TouchableOpacity
          onPress={markAllRead}
          style={[
            styles.markAll,
            { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md },
          ]}
        >
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 12 }}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.xxl + insets.bottom, paddingHorizontal: spacing.lg, gap: spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        <SummaryRow unreadCount={unreadCount} />
        <View style={{ gap: spacing.sm }}>
          {items.map((item) => (
            <NotificationCard key={item.id} item={item} onMarkRead={markItemRead} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const SummaryRow = ({ unreadCount }: { unreadCount: number }) => {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: spacing.sm }}>
      <View
        style={[
          styles.summaryCard,
          {
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: "700" }}>Unread</Text>
        <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text, marginTop: 4 }}>{unreadCount}</Text>
        <Text style={{ fontSize: 12, color: colors.success, marginTop: 2 }}>Catch up now</Text>
      </View>
      <View
        style={[
          styles.summaryCard,
          {
            flex: 1,
            backgroundColor: colors.surfaceElevated,
            borderRadius: radius.lg,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: "700" }}>Routing</Text>
        <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text, marginTop: 4 }}>Manual</Text>
        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Automation coming soon</Text>
      </View>
    </View>
  );
};

const NotificationCard = ({ item, onMarkRead }: { item: NotificationItem; onMarkRead: (id: string) => void }) => {
  const { colors, spacing, radius } = useTheme();
  const palette = severityPalette[item.severity];
  const isUnread = item.status === "unread";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderColor: isUnread ? colors.primary : colors.border,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.xs }}>
        <View style={[styles.dot, { backgroundColor: palette.dot }]} />
        <Text style={{ color: colors.textMuted, fontWeight: "700", marginLeft: spacing.xs, textTransform: "capitalize" }}>
          {item.category}
        </Text>
        <Badge label={item.severity} bg={palette.bg} textColor={palette.text} />
        {isUnread ? <Badge label="New" bg={colors.primaryLight} textColor={colors.textOnPrimary} /> : null}
      </View>

      <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 6 }}>{item.title}</Text>
      <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: spacing.sm }}>{item.body}</Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.sm }}>
        {item.actor ? <Badge label={item.actor} bg={colors.surfaceElevated} textColor={colors.text} /> : null}
        {item.tags?.map((tag) => (
          <Badge key={`${item.id}-${tag}`} label={tag} bg={colors.surfaceElevated} textColor={colors.text} />
        ))}
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>{formatRelativeTime(item.timestamp)}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          {item.actionLabel ? (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { borderColor: colors.border, backgroundColor: colors.surfaceElevated, borderRadius: radius.pill },
              ]}
            >
              <Text style={{ color: colors.text, fontWeight: "700", fontSize: 12 }}>{item.actionLabel}</Text>
            </TouchableOpacity>
          ) : null}
          {isUnread ? (
            <TouchableOpacity onPress={() => onMarkRead(item.id)}>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>Mark read</Text>
            </TouchableOpacity>
          ) : (
            <Text style={{ color: colors.textMuted, fontWeight: "600", fontSize: 12 }}>Archived</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const Badge = ({ label, bg, textColor }: { label: string; bg: string; textColor: string }) => (
  <View style={[styles.badge, { backgroundColor: bg }]}>
    <Text style={{ color: textColor, fontWeight: "700", fontSize: 11 }}>{label}</Text>
  </View>
);

const formatRelativeTime = (iso: string) => {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return "";
  const diff = Date.now() - timestamp;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  markAll: {
    borderWidth: 1,
    paddingVertical: 10,
  },
  summaryCard: {
    borderWidth: 1,
    padding: 16,
  },
  card: {
    borderWidth: 1,
    padding: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  actionButton: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
