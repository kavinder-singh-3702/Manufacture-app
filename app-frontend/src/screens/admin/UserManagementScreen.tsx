import { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Text,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
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

export const UserManagementScreen = () => {
  const { colors, spacing } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // State
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  // Action sheet state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);

  // Filtered users
  const filteredUsers = useMemo(() => {
    let result = allUsers;

    if (activeFilter !== "all") {
      result = result.filter((u) => u.status === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.displayName?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.firstName?.toLowerCase().includes(query) ||
          u.lastName?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [allUsers, activeFilter, searchQuery]);

  // Filter tabs config
  const filterTabs = useMemo(() => {
    const counts = {
      all: allUsers.length,
      active: allUsers.filter((u) => u.status === "active").length,
      inactive: allUsers.filter((u) => u.status === "inactive").length,
    };
    return [
      { key: "all" as FilterStatus, label: "All", count: counts.all },
      { key: "active" as FilterStatus, label: "Active", count: counts.active },
      {
        key: "inactive" as FilterStatus,
        label: "Inactive",
        count: counts.inactive,
      },
    ];
  }, [allUsers]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      const data = await adminService.listUsers();
      setAllUsers(data.users);
      setTotalCount(data.pagination.total);
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refetch users whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, [fetchUsers]);

  // Status helpers
  const getStatusType = (status: string) => {
    switch (status) {
      case "active":
        return "success" as const;
      case "inactive":
        return "error" as const;
      default:
        return "neutral" as const;
    }
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

  // Action sheet handlers
  const handleUserPress = (user: AdminUser) => {
    setSelectedUser(user);
    setActionSheetVisible(true);
  };

  const handleViewPreferences = () => {
    if (selectedUser) {
      navigation.navigate("UserPreferences", {
        userId: selectedUser.id,
        displayName: selectedUser.displayName || selectedUser.email,
      });
    }
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading users...
        </Text>
      </View>
    );
  }

  // Error state
  if (error && !loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setLoading(true);
            fetchUsers();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <AdminHeader
          title="Users"
          subtitle="Manage all users"
          count={totalCount}
        />

        {/* Search */}
        <AdminSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name or email..."
        />

        {/* Filter Tabs */}
        <AdminFilterTabs
          tabs={filterTabs}
          activeTab={activeFilter}
          onTabChange={setActiveFilter}
        />

        {/* Empty State */}
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {searchQuery ? "No users match your search" : "No users found"}
            </Text>
          </View>
        ) : (
          /* User List */
          <View style={styles.list}>
            {filteredUsers.map((user) => (
              <AdminListCard
                key={user.id}
                title={
                  user.displayName ||
                  `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                  "Unknown User"
                }
                subtitle={user.email}
                avatarText={(
                  user.displayName ||
                  user.email ||
                  "U"
                )[0].toUpperCase()}
                status={{
                  label: user.status,
                  type: getStatusType(user.status),
                }}
                meta={`Joined ${formatDate(user.createdAt)}`}
                onPress={() => handleUserPress(user)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action Sheet */}
      <AdminActionSheet
        visible={actionSheetVisible}
        onClose={() => {
          setActionSheetVisible(false);
          setSelectedUser(null);
        }}
        title={selectedUser?.displayName || selectedUser?.email}
        subtitle={selectedUser?.email}
        actions={[
          {
            label: "View Preferences",
            icon: "settings-outline",
            onPress: handleViewPreferences,
          },
          {
            label: "View Activity",
            icon: "time-outline",
            onPress: () => {
              // Future: navigate to activity screen
            },
          },
          {
            label: "Campaign Studio",
            icon: "megaphone-outline",
            onPress: () => {
              navigation.navigate("CampaignStudio");
            },
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
  },
  list: {
    gap: 16,
  },
});
