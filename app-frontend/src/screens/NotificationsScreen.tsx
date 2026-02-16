import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useTheme } from "../hooks/useTheme";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { useNotifications } from "../providers/NotificationsProvider";
import {
  notificationService,
  Notification,
  NotificationPriority,
} from "../services/notification.service";
import { handleNotificationAction } from "../services/notificationNavigation.service";

type ViewMode = "unread" | "all" | "archived";

const topicIcon = (topic?: string) => {
  if (!topic) return "notifications-outline";
  if (topic.includes("quote")) return "receipt-outline";
  if (topic.includes("campaign")) return "megaphone-outline";
  if (topic.includes("compliance")) return "shield-checkmark-outline";
  if (topic.includes("service")) return "construct-outline";
  return "notifications-outline";
};

export const NotificationsScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const { isCompact, isXCompact, contentPadding, clamp } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
    archiveById,
    unarchiveById,
    acknowledgeById,
  } = useNotifications();

  const [viewMode, setViewMode] = useState<ViewMode>("unread");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | "all">("all");
  const [archived, setArchived] = useState<Notification[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);

  const priorityPalette = useMemo<Record<NotificationPriority, { dot: string; text: string; bg: string }>>(
    () => ({
      low: {
        dot: colors.textMuted,
        text: colors.textSecondary,
        bg: colors.badgeNeutral,
      },
      normal: {
        dot: colors.primary,
        text: colors.primary,
        bg: colors.badgePrimary,
      },
      high: {
        dot: colors.warning,
        text: colors.warning,
        bg: colors.badgeWarning,
      },
      critical: {
        dot: colors.error,
        text: colors.error,
        bg: colors.badgeError,
      },
    }),
    [colors]
  );

  const loadArchived = useCallback(async () => {
    setArchivedLoading(true);
    try {
      const response = await notificationService.getNotifications({
        archived: true,
        limit: 80,
        offset: 0,
      });
      setArchived(response.notifications || []);
    } catch {
      setArchived([]);
    } finally {
      setArchivedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === "archived") {
      loadArchived();
    }
  }, [loadArchived, viewMode]);

  const filtered = useMemo(() => {
    const source = viewMode === "archived" ? archived : notifications;

    return source.filter((item) => {
      if (viewMode === "unread" && item.status !== "unread") return false;
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
      if (!search.trim()) return true;

      const haystack = `${item.title} ${item.body} ${item.eventKey} ${item.topic}`.toLowerCase();
      return haystack.includes(search.trim().toLowerCase());
    });
  }, [archived, notifications, priorityFilter, search, viewMode]);

  const onRefresh = useCallback(async () => {
    await refresh();
    if (viewMode === "archived") {
      await loadArchived();
    }
  }, [loadArchived, refresh, viewMode]);

  const runAction = useCallback(
    async (item: Notification) => {
      if (!item.action) return;

      const didNavigate = await handleNotificationAction(item.action, {
        ...item.data,
        notificationId: item.id,
      });
      if (!didNavigate) {
        navigation.navigate("Notifications");
      }
    },
    [navigation]
  );

  const activeLoading = loading || archivedLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: contentPadding, paddingVertical: isCompact ? spacing.sm : spacing.md }]}> 
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
        >
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </TouchableOpacity>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.title, { color: colors.text, fontSize: clamp(isXCompact ? 16 : 18, 15, 18) }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Priority inbox and delivery updates</Text>
        </View>

        <TouchableOpacity
          onPress={markAllAsRead}
          disabled={unreadCount <= 0}
          style={[
            styles.markAllBtn,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              borderRadius: radius.pill,
              opacity: unreadCount <= 0 ? 0.45 : 1,
            },
          ]}
        >
          <Text style={[styles.markAllText, { color: colors.text }]}>Mark all</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: contentPadding, paddingTop: spacing.sm, gap: spacing.sm }}>
        <View style={[styles.segmentRow, isXCompact ? styles.segmentRowWrap : null]}>
          {(["unread", "all", "archived"] as ViewMode[]).map((mode) => {
            const active = mode === viewMode;
            return (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.segment,
                  isXCompact ? styles.segmentCompact : null,
                  {
                    borderRadius: radius.pill,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primary + "1A" : colors.surface,
                  },
                ]}
                onPress={() => setViewMode(mode)}
              >
                <Text style={[styles.segmentText, { color: active ? colors.primary : colors.textMuted }]}>
                  {mode === "unread" ? "Unread" : mode === "all" ? "All" : "Archived"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search notifications"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: spacing.sm }}>
          {(["all", "low", "normal", "high", "critical"] as const).map((key) => {
            const active = key === priorityFilter;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterChip,
                  {
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primary + "1A" : colors.surface,
                    borderRadius: radius.pill,
                  },
                ]}
                onPress={() => setPriorityFilter(key)}
              >
                <Text style={[styles.filterChipText, { color: active ? colors.primary : colors.textMuted }]}>
                  {key === "all" ? "All priorities" : key}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1, marginTop: spacing.sm }}
        contentContainerStyle={{
          paddingHorizontal: contentPadding,
          paddingBottom: spacing.xxl + insets.bottom,
          gap: spacing.sm,
        }}
        refreshControl={<RefreshControl refreshing={activeLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={[styles.summaryRow, { gap: spacing.sm }, isXCompact ? styles.summaryColumn : null]}> 
          <View style={[styles.summaryCard, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg }]}> 
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Unread</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{unreadCount}</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg }]}> 
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Visible</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{filtered.length}</Text>
          </View>
        </View>

        {error ? (
          <View style={[styles.errorCard, { borderColor: colors.error + "66", backgroundColor: colors.error + "14", borderRadius: radius.md }]}> 
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}

        {!activeLoading && filtered.length === 0 ? (
          <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg }]}> 
            <Ionicons name="notifications-off-outline" size={26} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Try changing filters or check again later.</Text>
          </View>
        ) : null}

        {filtered.map((item) => {
          const palette = priorityPalette[item.priority] || priorityPalette.normal;
          const isUnread = item.status === "unread";

          return (
            <View
              key={item.id}
              style={[
                styles.card,
                {
                  borderColor: isUnread ? colors.primary + "55" : colors.border,
                  backgroundColor: colors.surface,
                  borderRadius: radius.lg,
                },
              ]}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardMetaWrap}>
                  <View style={[styles.priorityDot, { backgroundColor: palette.dot }]} />
                  <Ionicons name={topicIcon(item.topic) as any} size={14} color={colors.textMuted} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>{item.topic || "system"}</Text>
                </View>

                <View style={[styles.priorityBadge, { backgroundColor: palette.bg }]}> 
                  <Text style={[styles.priorityText, { color: palette.text }]}>{item.priority}</Text>
                </View>
              </View>

              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{item.body}</Text>

              <View style={styles.cardFooter}>
                <Text style={[styles.timeText, { color: colors.textMuted }]}>{new Date(item.createdAt).toLocaleString("en-IN")}</Text>

                <View style={styles.actionsRow}>
                  {item.action?.type && item.action.type !== "none" ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.surfaceElevated, borderRadius: radius.pill }]}
                      onPress={() => runAction(item)}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.text }]}>{item.action.label || "Open"}</Text>
                    </TouchableOpacity>
                  ) : null}

                  {item.requiresAck && !item.ackAt ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.surfaceElevated, borderRadius: radius.pill }]}
                      onPress={() => acknowledgeById(item.id)}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.text }]}>Acknowledge</Text>
                    </TouchableOpacity>
                  ) : null}

                  {viewMode !== "archived" ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.surfaceElevated, borderRadius: radius.pill }]}
                      onPress={() => archiveById(item.id)}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.textMuted }]}>Archive</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.surfaceElevated, borderRadius: radius.pill }]}
                      onPress={() => unarchiveById(item.id)}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.text }]}>Restore</Text>
                    </TouchableOpacity>
                  )}

                  {isUnread ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.primary + "12", borderRadius: radius.pill }]}
                      onPress={() => markAsRead(item.id)}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.primary }]}>Mark read</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </View>
          );
        })}

        {activeLoading ? (
          <View style={{ paddingVertical: spacing.lg, alignItems: "center" }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}

        {!activeLoading && viewMode !== "archived" && hasMore ? (
          <TouchableOpacity
            style={[
              styles.loadMoreBtn,
              {
                borderColor: colors.border,
                backgroundColor: colors.surfaceElevated,
                borderRadius: radius.md,
              },
            ]}
            onPress={loadMore}
          >
            <Text style={[styles.loadMoreText, { color: colors.text }]}>Load more</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  title: { fontSize: 18, fontWeight: "900" },
  subtitle: { fontSize: 12, fontWeight: "600", marginTop: 1 },
  markAllBtn: {
    minHeight: 34,
    minWidth: 74,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  markAllText: { fontSize: 12, fontWeight: "800" },
  segmentRow: { flexDirection: "row", gap: 8 },
  segmentRowWrap: { flexWrap: "wrap" },
  segment: {
    minHeight: 34,
    minWidth: 84,
    paddingHorizontal: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: { fontSize: 12, fontWeight: "800" },
  segmentCompact: { flex: 1, minWidth: 0 },
  searchBox: {
    minHeight: 42,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 0,
  },
  filterChip: {
    minHeight: 34,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  filterChipText: { fontSize: 12, fontWeight: "700" },
  summaryRow: { flexDirection: "row" },
  summaryColumn: { flexDirection: "column" },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    padding: 14,
    gap: 2,
  },
  summaryLabel: { fontSize: 12, fontWeight: "700" },
  summaryValue: { fontSize: 22, fontWeight: "900" },
  errorCard: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: { flex: 1, fontSize: 12, fontWeight: "700" },
  emptyCard: {
    borderWidth: 1,
    padding: 18,
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: { fontSize: 15, fontWeight: "900" },
  emptySubtitle: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  card: {
    borderWidth: 1,
    padding: 13,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardMetaWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metaText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  priorityText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  cardTitle: { fontSize: 15, fontWeight: "900", lineHeight: 20 },
  cardBody: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-end",
  },
  timeText: { fontSize: 11, fontWeight: "600", flex: 1 },
  loadMoreBtn: {
    minHeight: 42,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  loadMoreText: { fontSize: 13, fontWeight: "800" },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 8,
    flex: 1,
  },
  actionBtn: {
    minHeight: 32,
    borderWidth: 1,
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: { fontSize: 11, fontWeight: "800" },
});
