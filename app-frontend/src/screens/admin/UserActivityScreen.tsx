import { useState, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { adminService, AdminAuditEvent } from "../../services/admin.service";
import { RootStackParamList } from "../../navigation/types";
import { AdminHeader, AdminListCard } from "../../components/admin";

type UserActivityRouteProp = RouteProp<RootStackParamList, "UserActivity">;

const PAGE_SIZE = 25;

const titleCaseAction = (action: string) =>
  action
    .split(".")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

export const UserActivityScreen = () => {
  const { colors, spacing } = useTheme();
  const route = useRoute<UserActivityRouteProp>();
  const { userId, displayName } = route.params;

  const [events, setEvents] = useState<AdminAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });

  const fetchEvents = useCallback(
    async ({ reset = true, offset }: { reset?: boolean; offset?: number } = {}) => {
      if (!userId) {
        setLoading(false);
        setError("Missing user id for activity view.");
        return;
      }

      try {
        setError(null);
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const nextOffset = reset ? 0 : offset ?? 0;
        const response = await adminService.listAuditEvents({
          userId,
          limit: pagination.limit,
          offset: nextOffset,
        });

        setEvents((previous) => (reset ? response.events : [...previous, ...response.events]));
        setPagination(response.pagination);
      } catch (err: any) {
        console.error("Failed to fetch user activity:", err);
        setError(err.message || "Failed to load user activity");
        if (reset) {
          setEvents([]);
          setPagination((prev) => ({ ...prev, offset: 0, hasMore: false, total: 0 }));
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [pagination.limit, userId]
  );

  useFocusEffect(
    useCallback(() => {
      fetchEvents({ reset: true });
    }, [fetchEvents])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents({ reset: true });
  }, [fetchEvents]);

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusType = (action: string) => {
    if (action.includes("reject") || action.includes("failed")) return "error" as const;
    if (action.includes("approve") || action.includes("completed")) return "success" as const;
    if (action.includes("requested") || action.includes("queued")) return "warning" as const;
    return "neutral" as const;
  };

  const renderItem = useCallback(
    ({ item }: { item: AdminAuditEvent }) => (
      <AdminListCard
        title={item.label || titleCaseAction(item.action)}
        subtitle={item.description || item.company?.displayName || item.companyName || "No description available"}
        avatarText={(item.actor?.displayName || displayName || "U")[0].toUpperCase()}
        status={{ label: titleCaseAction(item.action), type: getStatusType(item.action) }}
        meta={formatDateTime(item.createdAt)}
      />
    ),
    [displayName]
  );

  const listHeader = useMemo(
    () => (
      <View style={{ padding: spacing.lg, paddingBottom: spacing.md }}>
        <AdminHeader
          title="User Activity"
          subtitle={displayName ? `Audit trail for ${displayName}` : "Immutable admin audit activity feed"}
          count={pagination.total}
        />
      </View>
    ),
    [displayName, pagination.total, spacing.lg, spacing.md]
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading activity...</Text>
      </View>
    );
  }

  if (error && !events.length && !loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}> 
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setLoading(true);
            fetchEvents({ reset: true });
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={[styles.emptyState, { paddingHorizontal: spacing.lg }]}> 
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No activity events found.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          if (loadingMore || !pagination.hasMore) return;
          fetchEvents({ reset: false, offset: pagination.offset + pagination.limit });
        }}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
  footerLoader: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
