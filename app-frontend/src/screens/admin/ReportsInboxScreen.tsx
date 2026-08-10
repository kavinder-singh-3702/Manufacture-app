import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { useToast } from "../../components/ui/Toast";
import {
  moderationService,
  REPORT_REASON_LABELS,
  type AdminReport,
} from "../../services/moderation.service";

type StatusFilter = "pending" | "resolved" | "dismissed";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "resolved", label: "Resolved" },
  { key: "dismissed", label: "Dismissed" },
];

const TARGET_ICON: Record<AdminReport["targetType"], keyof typeof Ionicons.glyphMap> = {
  product: "cube-outline",
  message: "chatbubble-ellipses-outline",
  user: "person-outline",
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleString();
};

/**
 * Admin moderation queue for user-submitted reports. Required alongside
 * the in-app Report action for Apple App Store Guideline 1.2 — a report
 * mechanism has to actually route somewhere a human reviews.
 */
export const ReportsInboxScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const { success: toastSuccess, error: toastError } = useToast();

  const [status, setStatus] = useState<StatusFilter>("pending");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setError(null);
      const response = await moderationService.listReports({ status, limit: 50, offset: 0 });
      setReports(response.reports || []);
      setPendingCount(response.counters?.pending ?? 0);
    } catch (err: any) {
      setError(err?.message || "Failed to load reports");
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchReports();
    }, [fetchReports])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReports();
  }, [fetchReports]);

  const handleAction = useCallback(
    (report: AdminReport, action: "resolved" | "dismissed") => {
      const verb = action === "resolved" ? "Resolve" : "Dismiss";
      Alert.alert(
        `${verb} report?`,
        action === "resolved"
          ? "Mark this report as actioned. Take any needed action on the content or user separately."
          : "Mark this report as reviewed with no violation found.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: verb,
            style: action === "resolved" ? "default" : "destructive",
            onPress: async () => {
              setActingId(report.id);
              try {
                await moderationService.resolveReport(report.id, { action });
                toastSuccess(`Report ${action}`, "Queue updated.");
                fetchReports();
              } catch (err: any) {
                toastError("Action failed", err?.message || "Could not update this report.");
              } finally {
                setActingId(null);
              }
            },
          },
        ]
      );
    },
    [fetchReports, toastError, toastSuccess]
  );

  const listHeader = useMemo(
    () => (
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
        <Text style={[styles.title, { color: colors.text }]}>Reports</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {pendingCount} pending {pendingCount === 1 ? "report" : "reports"}
        </Text>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = status === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setStatus(f.key)}
                activeOpacity={0.85}
                style={[
                  styles.filterChip,
                  {
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primary : "transparent",
                    borderRadius: radius.pill ?? 999,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: active ? colors.textOnPrimary : colors.textMuted },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    ),
    [colors, pendingCount, radius, spacing, status]
  );

  const renderItem = useCallback(
    ({ item }: { item: AdminReport }) => {
      const busy = actingId === item.id;
      return (
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
              marginHorizontal: spacing.lg,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.typeIcon, { backgroundColor: colors.primary + "18" }]}>
              <Ionicons name={TARGET_ICON[item.targetType]} size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                {REPORT_REASON_LABELS[item.reason] || item.reason}
              </Text>
              <Text style={[styles.cardMeta, { color: colors.textMuted }]} numberOfLines={1}>
                {item.targetType} · reported by {item.reporter?.displayName || item.reporter?.email || "unknown"}
              </Text>
            </View>
          </View>

          {item.details ? (
            <Text style={[styles.cardDetails, { color: colors.textSecondary }]}>{item.details}</Text>
          ) : null}

          <View style={styles.cardFooterRow}>
            <Text style={[styles.cardMeta, { color: colors.textMuted }]} numberOfLines={1}>
              Owner: {item.targetOwner?.displayName || item.targetOwner?.email || "—"}
            </Text>
            <Text style={[styles.cardMeta, { color: colors.textMuted }]}>{formatDate(item.createdAt)}</Text>
          </View>

          {item.status === "pending" ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                disabled={busy}
                onPress={() => handleAction(item, "dismissed")}
                activeOpacity={0.85}
                style={[styles.actionBtn, { borderColor: colors.border, borderRadius: radius.md }]}
              >
                <Text style={[styles.actionBtnText, { color: colors.textMuted }]}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={busy}
                onPress={() => handleAction(item, "resolved")}
                activeOpacity={0.85}
                style={[
                  styles.actionBtn,
                  { backgroundColor: colors.primary, borderColor: colors.primary, borderRadius: radius.md },
                ]}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                ) : (
                  <Text style={[styles.actionBtnText, { color: colors.textOnPrimary }]}>Resolve</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.resolvedNote, { color: colors.textMuted }]}>
              {item.status === "resolved" ? "Resolved" : "Dismissed"}
              {item.resolvedBy?.displayName ? ` by ${item.resolvedBy.displayName}` : ""}
              {item.resolvedAt ? ` · ${formatDate(item.resolvedAt)}` : ""}
            </Text>
          )}
        </View>
      );
    },
    [actingId, colors, handleAction, radius, spacing]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      <View style={[styles.topBar, { borderBottomColor: colors.border, paddingHorizontal: spacing.lg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.backHit}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.text }]}>Moderation</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textMuted, marginTop: 12, fontWeight: "600" }}>Loading reports…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.error, fontWeight: "700", marginBottom: 10 }}>{error}</Text>
          <TouchableOpacity onPress={() => { setLoading(true); fetchReports(); }}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          ListEmptyComponent={
            <View style={[styles.centered, { paddingTop: 40 }]}>
              <Ionicons name="shield-checkmark-outline" size={40} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, marginTop: 12, fontWeight: "600" }}>
                No {status} reports.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  backHit: { flexDirection: "row", alignItems: "center", gap: 2, width: 60 },
  backText: { fontSize: 15, fontWeight: "700" },
  topTitle: { fontSize: 16, fontWeight: "800" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 24, fontWeight: "800", marginTop: 12 },
  subtitle: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  filterRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1 },
  filterChipText: { fontSize: 13, fontWeight: "700" },
  card: { borderWidth: 1, padding: 14 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  typeIcon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 14, fontWeight: "800" },
  cardMeta: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  cardDetails: { fontSize: 13, lineHeight: 19, marginTop: 10 },
  cardFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 10,
  },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: { fontSize: 13, fontWeight: "800" },
  resolvedNote: { fontSize: 11, fontWeight: "600", marginTop: 12 },
});
