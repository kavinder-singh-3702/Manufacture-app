import { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text,
  TouchableOpacity,
  FlatList,
  Linking,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useAuth } from "../../hooks/useAuth";
import { adminService, AdminUser } from "../../services/admin.service";
import { RootStackParamList } from "../../navigation/types";
import {
  AdminHeader,
  AdminSearchBar,
  AdminFilterTabs,
  AdminListCard,
  AdminActionSheet,
} from "../../components/admin";

type FilterStatus = "all" | "active" | "inactive";

const PAGE_SIZE = 30;

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

export const UserManagementScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const { resolvedMode } = useThemeMode();
  const isDark = resolvedMode === "dark";
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Default to "active" so admins don't see deactivated accounts mixed
  // in with the live user list. Filter tabs let them still switch to
  // "inactive" / "suspended" when they need to reactivate an account.
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("active");
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

  const getStatusType = (state: string) => {
    switch (state) {
      case "active":
        return "success" as const;
      case "inactive":
      case "suspended":
      case "never_logged_in":
        return "error" as const;
      case "deleted":
        return "error" as const;
      default:
        return "neutral" as const;
    }
  };

  const getStatusLabel = (state: string) => {
    if (state === "inactive") return "Inactive";
    if (state === "suspended") return "Suspended";
    if (state === "deleted") return "Deleted";
    if (state === "never_logged_in") return "Never logged in";
    return "Active";
  };

  const getLastSeenLabel = (user: AdminUser): string => {
    if (user.activityState === "suspended") return "Suspended by admin";
    if (user.activityState === "deleted") return "Deleted";
    if (user.daysSinceLogin === null || user.daysSinceLogin === undefined) {
      return user.lastLoginAt ? `Last seen ${formatDate(user.lastLoginAt)}` : "Never logged in";
    }
    if (user.daysSinceLogin === 0) return "Last seen today";
    if (user.daysSinceLogin === 1) return "Last seen yesterday";
    if (user.daysSinceLogin < 30) return `Last seen ${user.daysSinceLogin} days ago`;
    return `Last seen ${formatDate(user.lastLoginAt)}`;
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
      ...(selectedUser?.phone
        ? [
            {
              label: `Call ${selectedUser.phone}`,
              icon: "call-outline" as const,
              onPress: () => {
                const url = `tel:${selectedUser.phone}`;
                Linking.canOpenURL(url)
                  .then((supported) =>
                    supported
                      ? Linking.openURL(url)
                      : Alert.alert("Cannot place call", "This device cannot make phone calls.")
                  )
                  .catch(() =>
                    Alert.alert("Call failed", "Unable to start the call. Try again.")
                  );
              },
            },
          ]
        : []),
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
      // Hide the Activate/Deactivate action when the target user is the
      // current admin themselves. Deactivating your own account would
      // instantly invalidate the session you're using to make the call
      // and lock you out.
      ...(selectedUser && selectedUser.id !== currentAdmin?.id
        ? [
            (() => {
              const isCurrentlyInactive =
                selectedUser.status === "inactive" || selectedUser.status === "suspended";
              const targetStatus: "active" | "inactive" = isCurrentlyInactive ? "active" : "inactive";
              const verb = isCurrentlyInactive ? "Activate" : "Deactivate";
              return {
                label: `${verb} user`,
                icon: (isCurrentlyInactive ? "checkmark-circle-outline" : "ban-outline") as const,
                destructive: !isCurrentlyInactive,
                onPress: () => {
                  Alert.alert(
                    `${verb} user`,
                    `Confirm: mark ${selectedUser.displayName || selectedUser.email} as ${targetStatus}?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: verb,
                        style: isCurrentlyInactive ? "default" : "destructive",
                        onPress: async () => {
                          try {
                            await adminService.setUserStatus(selectedUser.id, targetStatus);
                            fetchUsers({ reset: true });
                          } catch (err: any) {
                            Alert.alert(
                              "Status change failed",
                              err?.message || "Unable to update user status."
                            );
                          }
                        },
                      },
                    ]
                  );
                },
              };
            })(),
          ]
        : []),
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
        label: "Run Advertisement",
        icon: "megaphone-outline" as const,
        onPress: () => {
          if (!selectedUser) return;
          navigation.navigate("AdStudio", {
            prefillOwnerUserId: selectedUser.id,
            prefillOwnerUserName: selectedUser.displayName || selectedUser.email,
          });
        },
      },
      // "Ops Console" per-row action removed in phase 4 of the ops rebuild —
      // ops triage isn't a property of a single user, so this entry belonged
      // in the wrong place. The Ops tab is the canonical entry point.
    ],
    [navigation, selectedUser, fetchUsers]
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
    ({ item }: { item: AdminUser }) => {
      const phoneLine = item.phone ? `📱 ${item.phone}` : "📱 No phone on file";
      const effectiveState = item.activityState || item.status;
      return (
        <AdminListCard
          key={item.id}
          title={
            item.displayName ||
            `${item.firstName || ""} ${item.lastName || ""}`.trim() ||
            "Unknown user"
          }
          subtitle={`${item.email}\n${phoneLine}`}
          avatarText={(item.displayName || item.email || "U")[0].toUpperCase()}
          status={{
            label: getStatusLabel(effectiveState),
            type: getStatusType(effectiveState),
          }}
          meta={`${getLastSeenLabel(item)} • Joined ${formatDate(item.createdAt)}${item.role ? ` • ${item.role}` : ""}`}
          onPress={() => openActionSheet(item)}
        />
      );
    },
    [openActionSheet]
  );

  const listHeader = useMemo(
    () => (
      <View>
        <AdminHeader
          title="Users"
          subtitle="Manage account access, preferences, and audit visibility."
          count={pagination.total}
        />
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }}>
          <AdminSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search users by name, email, or phone..."
          />

          <AdminFilterTabs tabs={filterTabs} activeTab={activeFilter} onTabChange={setActiveFilter} />
        </View>
      </View>
    ),
    [activeFilter, filterTabs, pagination.total, searchQuery, spacing.lg, spacing.md, spacing.sm]
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: neuCardBg(isDark) }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading users...</Text>
      </View>
    );
  }

  if (error && !users.length && !loading) {
    return (
      <View style={[styles.centered, { backgroundColor: neuCardBg(isDark) }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: neuCardBg(isDark), borderRadius: radius.lg, ...neuRaised(isDark) }]}
          onPress={() => {
            setLoading(true);
            fetchUsers({ reset: true });
          }}
        >
          <Text style={[styles.retryButtonText, { color: colors.primary }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: neuCardBg(isDark) }]}>
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
        subtitle={
          selectedUser
            ? `${selectedUser.email}${selectedUser.phone ? `\n📱 ${selectedUser.phone}` : ""}`
            : undefined
        }
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
