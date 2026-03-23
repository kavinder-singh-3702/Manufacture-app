import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  adminService,
  AdminOpsRequest,
} from "../../services/admin.service";
import { AdminHeader, AdminSearchBar } from "../../components/admin";

type PipelineColumn = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  colorKey: "warning" | "primary" | "success" | "error";
  statuses: string[];
};

const PIPELINE_COLUMNS: PipelineColumn[] = [
  {
    key: "pending",
    label: "Pending",
    icon: "time",
    colorKey: "warning",
    statuses: ["pending", "new"],
  },
  {
    key: "in_progress",
    label: "In Progress",
    icon: "sync",
    colorKey: "primary",
    statuses: ["in_review", "scheduled", "in_progress", "contacted", "planning", "onboarding"],
  },
  {
    key: "completed",
    label: "Completed",
    icon: "checkmark-circle",
    colorKey: "success",
    statuses: ["completed", "launched", "closed"],
  },
  {
    key: "rejected",
    label: "Rejected",
    icon: "close-circle",
    colorKey: "error",
    statuses: ["rejected", "cancelled"],
  },
];

const NEU_LIGHT = "#EDF1F7";
const NEU_DARK = "#1A1F2B";
const NEU_INSET_LIGHT = "#E2E8F0";
const NEU_INSET_DARK = "#151A24";
const neuRaised = (isDark: boolean) =>
  isDark
    ? { shadowColor: "#000", shadowOffset: { width: 2, height: 3 }, shadowOpacity: 0.45, shadowRadius: 6, elevation: 4 }
    : { shadowColor: "#A3B1C6", shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 };
const neuPressed = (isDark: boolean) =>
  isDark
    ? { shadowColor: "#000", shadowOffset: { width: 1, height: 1 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 1 }
    : { shadowColor: "#A3B1C6", shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 1 };
const neuCardBg = (isDark: boolean) => (isDark ? NEU_DARK : NEU_LIGHT);
const neuInsetBg = (isDark: boolean) => (isDark ? NEU_INSET_DARK : NEU_INSET_LIGHT);

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString("en-IN", { day: "2-digit", month: "short" });
};

const getPriorityColor = (priority: string, colors: any) => {
  if (priority === "critical") return colors.error;
  if (priority === "high") return colors.warning;
  return colors.textMuted;
};

export const AdminOrdersScreen = () => {
  const { colors, radius } = useTheme();
  const { resolvedMode } = useThemeMode();
  const isDark = resolvedMode === "dark";
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const [requests, setRequests] = useState<AdminOpsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  const fetchOrders = useCallback(
    async (isRefresh = false) => {
      try {
        isRefresh ? setRefreshing(true) : setLoading(true);
        const { requests: data } = await adminService.listOpsRequests({
          limit: 100,
          kind: "service",
          sort: "updatedAt:desc",
          search: searchQuery || undefined,
        });
        setRequests(data);
      } catch (error) {
        console.warn("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery]
  );

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const getColumnOrders = (col: PipelineColumn) =>
    requests.filter((r) => col.statuses.includes(r.status));

  const columnWidth = Math.max(width * 0.72, 280);

  const renderOrderCard = (item: AdminOpsRequest, col: PipelineColumn) => {
    const color = colors[col.colorKey];
    const priorityColor = getPriorityColor(item.priority, colors);
    const isPriorityHigh = item.priority === "critical" || item.priority === "high";

    return (
      <View
        key={item.id}
        style={[
          styles.orderCard,
          {
            backgroundColor: neuCardBg(isDark),
            borderRadius: radius.lg,
            borderLeftWidth: 4,
            borderLeftColor: color,
            ...neuRaised(isDark),
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
            {item.company?.displayName ?? item.title}
          </Text>
          {isPriorityHigh && (
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor + "18" }]}>
              <Text style={[styles.priorityText, { color: priorityColor }]}>
                {item.priority.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={[styles.cardMeta, { color: colors.textMuted }]}>{formatDate(item.updatedAt)}</Text>
          <View style={[styles.statusChip, { backgroundColor: color + "15" }]}>
            <Text style={[styles.statusChipText, { color }]}>
              {item.status.replace(/_/g, " ")}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && requests.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: neuCardBg(isDark) }]}>
        <View style={styles.headerSection}>
          <AdminHeader title="Orders" subtitle="Kanban pipeline view" />
          <AdminSearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search orders..." />
        </View>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: neuCardBg(isDark) }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)} tintColor={colors.primary} />
        }
        stickyHeaderIndices={[0]}
      >
        <View style={[styles.headerSection, { backgroundColor: neuCardBg(isDark) }]}>
          <AdminHeader title="Orders" subtitle="Kanban pipeline view" />
          <AdminSearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search orders..." />
        </View>

        {/* Pipeline Column Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
        >
          {PIPELINE_COLUMNS.map((col) => {
            const count = getColumnOrders(col).length;
            const isActive = activeColumn === col.key || activeColumn === null;
            const color = colors[col.colorKey];
            return (
              <TouchableOpacity
                key={col.key}
                activeOpacity={0.7}
                onPress={() => setActiveColumn(activeColumn === col.key ? null : col.key)}
                style={[
                  styles.pipelineTab,
                  {
                    backgroundColor: isActive ? color + "12" : neuCardBg(isDark),
                    borderRadius: radius.lg,
                    ...(isActive ? neuPressed(isDark) : neuRaised(isDark)),
                  },
                ]}
              >
                <Ionicons name={col.icon} size={18} color={isActive ? color : colors.textMuted} />
                <Text style={[styles.pipelineTabLabel, { color: isActive ? color : colors.textSecondary }]}>
                  {col.label}
                </Text>
                <View style={[styles.pipelineCount, { backgroundColor: isActive ? color + "25" : colors.text + "10" }]}>
                  <Text style={[styles.pipelineCountText, { color: isActive ? color : colors.textMuted }]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Kanban Columns */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kanbanContainer}
          decelerationRate="fast"
          snapToInterval={columnWidth + 12}
        >
          {PIPELINE_COLUMNS
            .filter((col) => activeColumn === null || activeColumn === col.key)
            .map((col) => {
              const orders = getColumnOrders(col);
              const color = colors[col.colorKey];

              return (
                <View key={col.key} style={[styles.kanbanColumn, { width: activeColumn ? width - 32 : columnWidth }]}>
                  {/* Column Header */}
                  <View style={[styles.columnHeader, { backgroundColor: neuInsetBg(isDark), borderRadius: radius.md, ...neuRaised(isDark) }]}>
                    <Ionicons name={col.icon} size={16} color={color} />
                    <Text style={[styles.columnTitle, { color }]}>{col.label}</Text>
                    <View style={[styles.columnCount, { backgroundColor: color + "20" }]}>
                      <Text style={[styles.columnCountText, { color }]}>{orders.length}</Text>
                    </View>
                  </View>

                  {/* Cards */}
                  {orders.length === 0 ? (
                    <View style={[styles.emptyColumn, { backgroundColor: neuInsetBg(isDark), borderRadius: radius.lg, ...neuPressed(isDark) }]}>
                      <Text style={[styles.emptyText, { color: colors.textMuted }]}>No orders</Text>
                    </View>
                  ) : (
                    orders.map((item) => renderOrderCard(item, col))
                  )}
                </View>
              );
            })}
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: { paddingHorizontal: 16, paddingTop: 8 },
  tabRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
  pipelineTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pipelineTabLabel: { fontSize: 13, fontWeight: "700" },
  pipelineCount: { minWidth: 22, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  pipelineCountText: { fontSize: 11, fontWeight: "800" },
  kanbanContainer: { paddingHorizontal: 16, gap: 12, paddingBottom: 32 },
  kanbanColumn: { gap: 8 },
  columnHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
  },
  columnTitle: { fontSize: 14, fontWeight: "800", flex: 1 },
  columnCount: { minWidth: 24, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  columnCountText: { fontSize: 12, fontWeight: "800" },
  orderCard: { padding: 12, gap: 6 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "700", flex: 1 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  priorityText: { fontSize: 10, fontWeight: "800" },
  cardSubtitle: { fontSize: 13, fontWeight: "500", lineHeight: 18 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  cardMeta: { fontSize: 12, fontWeight: "600" },
  statusChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  statusChipText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  emptyColumn: { padding: 24, alignItems: "center" },
  emptyText: { fontSize: 13, fontWeight: "600" },
});
