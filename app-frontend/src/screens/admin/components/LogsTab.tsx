import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../../hooks/useTheme";
import { useThemeMode } from "../../../hooks/useThemeMode";
import {
  adminService,
  AdminAuditEvent,
  AdminCallLog,
} from "../../../services/admin.service";
import { AdminFilterTabs, AdminListCard } from "../../../components/admin";

/* ── Neumorphic helpers ── */
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

type LogView = "audit" | "calls";

const VIEW_TABS: { key: LogView; label: string }[] = [
  { key: "audit", label: "Audit Events" },
  { key: "calls", label: "Call Logs" },
];

const PAGE_SIZE = 25;

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (seconds?: number) => {
  const safe = Math.max(Number(seconds || 0), 0);
  const minutes = Math.floor(safe / 60);
  const rem = safe % 60;
  if (!minutes) return `${rem}s`;
  return `${minutes}m ${rem}s`;
};

export const LogsTab = () => {
  const { colors } = useTheme();
  const { resolvedMode } = useThemeMode();
  const isDark = resolvedMode === "dark";

  const [activeView, setActiveView] = useState<LogView>("audit");
  const [auditEvents, setAuditEvents] = useState<AdminAuditEvent[]>([]);
  const [callLogs, setCallLogs] = useState<AdminCallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const fetchLogs = useCallback(
    async (offset = 0, isRefresh = false) => {
      try {
        if (offset === 0) isRefresh ? setRefreshing(true) : setLoading(true);

        if (activeView === "audit") {
          const { events, pagination } = await adminService.listAuditEvents({
            limit: PAGE_SIZE,
            offset,
          });
          offset === 0 ? setAuditEvents(events) : setAuditEvents((prev) => [...prev, ...events]);
          setHasMore(pagination.hasMore);
        } else {
          const { callLogs: logs, pagination } = await adminService.listCallLogs({
            limit: PAGE_SIZE,
            offset,
          });
          offset === 0 ? setCallLogs(logs) : setCallLogs((prev) => [...prev, ...logs]);
          setHasMore(pagination.hasMore);
        }
      } catch (error) {
        console.warn("Failed to fetch logs:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeView]
  );

  useFocusEffect(
    useCallback(() => {
      fetchLogs(0);
    }, [fetchLogs])
  );

  const handleViewChange = (view: LogView) => {
    setActiveView(view);
    setAuditEvents([]);
    setCallLogs([]);
    setHasMore(false);
  };

  const currentData = activeView === "audit" ? auditEvents : callLogs;

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchLogs(currentData.length);
    }
  };

  const renderAuditItem = ({ item }: { item: AdminAuditEvent }) => (
    <View style={[styles.cardWrapper, { backgroundColor: neuCardBg(isDark), borderRadius: 14, ...neuRaised(isDark) }]}>
      <AdminListCard
        title={item.label ?? item.action}
        subtitle={item.description ?? item.action}
        meta={formatDate(item.createdAt)}
        avatarText={item.actor?.displayName?.[0] ?? "S"}
        status={item.category ? { label: item.category, type: "neutral" } : undefined}
      />
    </View>
  );

  const renderCallItem = ({ item }: { item: AdminCallLog }) => (
    <View style={[styles.cardWrapper, { backgroundColor: neuCardBg(isDark), borderRadius: 14, ...neuRaised(isDark) }]}>
      <AdminListCard
        title={item.caller?.displayName ?? "Unknown"}
        subtitle={`Called ${item.callee?.displayName ?? "Unknown"} - ${formatDuration(item.durationSeconds)}`}
        meta={formatDate(item.startedAt)}
        avatarText={item.caller?.displayName?.[0] ?? "?"}
        status={{ label: item.durationSeconds > 0 ? "completed" : "missed", type: item.durationSeconds > 0 ? "success" : "error" }}
      />
    </View>
  );

  const ListHeader = (
    <View style={[styles.headerContainer, { backgroundColor: neuInsetBg(isDark), borderRadius: 14, ...neuPressed(isDark) }]}>
      <AdminFilterTabs tabs={VIEW_TABS} activeTab={activeView} onTabChange={handleViewChange} />
    </View>
  );

  if (loading && currentData.length === 0) {
    return (
      <View>
        {ListHeader}
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <FlatList
      data={currentData as any[]}
      keyExtractor={(item) => item.id}
      renderItem={activeView === "audit" ? renderAuditItem as any : renderCallItem as any}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No {activeView === "audit" ? "audit events" : "call logs"} found
        </Text>
      }
      ListFooterComponent={
        hasMore ? <ActivityIndicator color={colors.primary} style={{ paddingVertical: 16 }} /> : null
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.3}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchLogs(0, true)}
          tintColor={colors.primary}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 16,
  },
  cardWrapper: {
    marginBottom: 10,
    overflow: "hidden",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    paddingVertical: 40,
  },
});
