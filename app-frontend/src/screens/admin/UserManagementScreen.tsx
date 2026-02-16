import { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { adminService, AdminUser } from "../../services/admin.service";
import { RootStackParamList } from "../../navigation/types";
import { routes } from "../../navigation/routes";
import {
  AdminHeader,
  AdminSearchBar,
  AdminFilterTabs,
  AdminListCard,
  AdminActionSheet,
} from "../../components/admin";

type FilterStatus = "all" | "active" | "inactive";

const PAGE_SIZE = 30;

export const UserManagementScreen = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);

  const fetchUsers = useCallback(
    async ({
      reset = true,
      explicitSearch,
      offset,
    }: {
      reset?: boolean;
      explicitSearch?: string;
      offset?: number;
    } = {}) => {
      const query = (explicitSearch ?? searchQuery).trim();
      const nextOffset = reset ? 0 : offset ?? 0;

      try {
        setError(null);
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await adminService.listUsers({
          status: activeFilter === "all" ? undefined : activeFilter,
          search: query || undefined,
          limit: pagination.limit,
          offset: nextOffset,
          sort: "updatedAt:desc",
        });

        setUsers((previous) => (reset ? response.users : [...previous, ...response.users]));
        setPagination(response.pagination);
      } catch (err: any) {
        console.error("Failed to fetch users:", err);
        setError(err.message || "Failed to load users");
        if (reset) {
          setUsers([]);
          setPagination((prev) => ({ ...prev, offset: 0, hasMore: false, total: 0 }));
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [activeFilter, pagination.limit, searchQuery]
  );

  useFocusEffect(
    useCallback(() => {
      fetchUsers({ reset: true });
    }, [fetchUsers])
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers({ reset: true, explicitSearch: searchQuery });
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, activeFilter, fetchUsers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers({ reset: true });
  }, [fetchUsers]);

  const getStatusType = (status: string) => {
    switch (status) {
      case "active":
        return "success" as const;
      case "inactive":
      case "suspended":
        return "error" as const;
      default:
        return "neutral" as const;
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === "inactive") return "Inactive";
    if (status === "suspended") return "Suspended";
    return "Active";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const openActionSheet = useCallback((user: AdminUser) => {
    setSelectedUser(user);
    setActionSheetVisible(true);
  }, []);

  const closeActionSheet = useCallback(() => {
    setActionSheetVisible(false);
    setSelectedUser(null);
  }, []);

  const actions = useMemo(
    () => [
      {
        label: "User 360",
        icon: "person-circle-outline" as const,
        onPress: () => {
          if (!selectedUser) return;
          navigation.navigate("AdminUserDetail", {
            userId: selectedUser.id,
            displayName: selectedUser.displayName || selectedUser.email,
          });
        },
      },
      {
        label: "View Preferences",
        icon: "settings-outline" as const,
        onPress: () => {
          if (!selectedUser) return;
          navigation.navigate("UserPreferences", {
            userId: selectedUser.id,
            displayName: selectedUser.displayName || selectedUser.email,
          });
        },
      },
      {
        label: "View Activity",
        icon: "time-outline" as const,
        onPress: () => {
          if (!selectedUser) return;
          navigation.navigate("UserActivity", {
            userId: selectedUser.id,
            displayName: selectedUser.displayName || selectedUser.email,
          });
        },
      },
      {
        label: "Campaign Studio",
        icon: "megaphone-outline" as const,
        onPress: () => {
          navigation.navigate("CampaignStudio");
        },
      },
      {
        label: "Ops Console",
        icon: "chatbubbles-outline" as const,
        onPress: () => {
          navigation.navigate("Main", { screen: routes.CHAT });
        },
      },
    ],
    [navigation, selectedUser]
  );

  const filterTabs = useMemo(
    () => [
      { key: "all" as FilterStatus, label: "All" },
      { key: "active" as FilterStatus, label: "Active" },
      { key: "inactive" as FilterStatus, label: "Inactive" },
    ],
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: AdminUser }) => (
      <AdminListCard
        key={item.id}
        title={
          item.displayName ||
          `${item.firstName || ""} ${item.lastName || ""}`.trim() ||
          "Unknown user"
        }
        subtitle={item.email}
        avatarText={(item.displayName || item.email || "U")[0].toUpperCase()}
        status={{
          label: getStatusLabel(item.status),
          type: getStatusType(item.status),
        }}
        meta={`Joined ${formatDate(item.createdAt)}${item.role ? ` • ${item.role}` : ""}`}
        onPress={() => openActionSheet(item)}
      />
    ),
    [openActionSheet]
  );

  const listHeader = useMemo(
    () => (
      <View style={{ padding: spacing.lg, paddingBottom: spacing.md }}>
        <AdminHeader
          title="Users"
          subtitle="Manage account access, preferences, and audit visibility."
          count={pagination.total}
        />

        <AdminSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search users by name or email..."
        />

        <AdminFilterTabs tabs={filterTabs} activeTab={activeFilter} onTabChange={setActiveFilter} />
      </View>
    ),
    [activeFilter, filterTabs, pagination.total, searchQuery, spacing.lg, spacing.md]
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading users...</Text>
      </View>
    );
  }

  if (error && !users.length && !loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setLoading(true);
            fetchUsers({ reset: true });
          }}
        >
          <Text style={[styles.retryButtonText, { color: colors.textOnPrimary }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={[styles.emptyState, { paddingHorizontal: spacing.lg }]}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {searchQuery.trim() ? "No users match your current filters" : "No users found"}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (loadingMore || !pagination.hasMore) return;
          fetchUsers({ reset: false, offset: pagination.offset + pagination.limit });
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

      <AdminActionSheet
        visible={actionSheetVisible}
        onClose={closeActionSheet}
        title={selectedUser?.displayName || selectedUser?.email}
        subtitle={selectedUser?.email}
        actions={actions}
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
