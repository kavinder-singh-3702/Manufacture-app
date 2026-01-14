import { useCallback, useEffect } from "react";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useNotifications } from "../providers/NotificationsProvider";
import type { Notification, NotificationPriority } from "../services/notification.service";

const priorityPalette: Record<NotificationPriority, { dot: string; text: string; bg: string }> = {
  low: { dot: "#6b7280", text: "#6b7280", bg: "rgba(107,114,128,0.08)" },
  normal: { dot: "#4338ca", text: "#4338ca", bg: "rgba(67,56,202,0.08)" },
  high: { dot: "#b45309", text: "#b45309", bg: "rgba(180,83,9,0.1)" },
  critical: { dot: "#b4234d", text: "#b4234d", bg: "rgba(180,35,77,0.12)" },
};

export const NotificationsScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
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
  } = useNotifications();

  // Refresh on mount
  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = useCallback(
    (event: any) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
      if (isCloseToBottom && hasMore && !loading) {
        loadMore();
      }
    },
    [hasMore, loading, loadMore]
  );

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
          onPress={markAllAsRead}
          disabled={unreadCount === 0}
          style={[
            styles.markAll,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              borderRadius: radius.pill,
              paddingHorizontal: spacing.md,
              opacity: unreadCount === 0 ? 0.5 : 1,
            },
          ]}
        >
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 12 }}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.xxl + insets.bottom, paddingHorizontal: spacing.lg, gap: spacing.md }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        refreshControl={<RefreshControl refreshing={loading && notifications.length === 0} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <SummaryRow unreadCount={unreadCount} total={notifications.length} />

        {/* Error State */}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.error + "15", borderColor: colors.error + "30", borderRadius: radius.lg }]}>
            <Text style={{ color: colors.error, fontSize: 14 }}>{error}</Text>
            <TouchableOpacity onPress={refresh}>
              <Text style={{ color: colors.error, fontWeight: "700", fontSize: 14, marginLeft: spacing.sm }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!loading && notifications.length === 0 && !error && (
          <View style={[styles.emptyState, { backgroundColor: colors.surface, borderRadius: radius.lg, borderColor: colors.border }]}>
            <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🔔</Text>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: spacing.xs }}>No notifications yet</Text>
            <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: "center" }}>
              You'll see updates and alerts here when something important happens.
            </Text>
          </View>
        )}

        {/* Notification List */}
        <View style={{ gap: spacing.sm }}>
          {notifications.map((item) => (
            <NotificationCard key={item.id} item={item} onMarkRead={markAsRead} />
          ))}
        </View>

        {/* Loading More */}
        {loading && notifications.length > 0 && (
          <View style={{ paddingVertical: spacing.lg, alignItems: "center" }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const SummaryRow = ({ unreadCount, total }: { unreadCount: number; total: number }) => {
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
        <Text style={{ fontSize: 12, color: unreadCount > 0 ? colors.warning : colors.success, marginTop: 2 }}>
          {unreadCount > 0 ? "Catch up now" : "All caught up!"}
        </Text>
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
        <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: "700" }}>Total</Text>
        <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text, marginTop: 4 }}>{total}</Text>
        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Notifications</Text>
      </View>
    </View>
  );
};

const NotificationCard = ({ item, onMarkRead }: { item: Notification; onMarkRead: (id: string) => void }) => {
  const { colors, spacing, radius } = useTheme();
  const palette = priorityPalette[item.priority] || priorityPalette.normal;
  const isUnread = item.status === "unread";

  // Extract action from data if available
  const actionLabel = item.data?.actionLabel as string | undefined;

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
          {item.topic || "system"}
        </Text>
        <Badge label={item.priority} bg={palette.bg} textColor={palette.text} />
        {isUnread ? <Badge label="New" bg={colors.primaryLight} textColor={colors.textOnPrimary} /> : null}
      </View>

      <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 6 }}>{item.title}</Text>
      <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: spacing.sm }}>{item.body}</Text>

      {/* Event Key Badge */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.sm }}>
        {item.eventKey && <Badge label={item.eventKey.split(".").pop() || item.eventKey} bg={colors.surfaceElevated} textColor={colors.text} />}
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>{formatRelativeTime(item.createdAt)}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          {actionLabel ? (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { borderColor: colors.border, backgroundColor: colors.surfaceElevated, borderRadius: radius.pill },
              ]}
            >
              <Text style={{ color: colors.text, fontWeight: "700", fontSize: 12 }}>{actionLabel}</Text>
            </TouchableOpacity>
          ) : null}
          {isUnread ? (
            <TouchableOpacity onPress={() => onMarkRead(item.id)}>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>Mark read</Text>
            </TouchableOpacity>
          ) : (
            <Text style={{ color: colors.textMuted, fontWeight: "600", fontSize: 12 }}>Read</Text>
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
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderWidth: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderWidth: 1,
  },
});
