import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { adminService, AdminUser } from "../../services/admin.service";

// ============================================================
// FILTER STATUS TYPE
// ============================================================
type FilterStatus = "all" | "active" | "inactive";

// ============================================================
// USER MANAGEMENT SCREEN
// ============================================================
// Allows admins to view and manage all users

export const UserManagementScreen = () => {
  // ------------------------------------------------------------
  // HOOKS & THEME
  // ------------------------------------------------------------
  const { colors, spacing } = useTheme();

  // ------------------------------------------------------------
  // STATE MANAGEMENT
  // ------------------------------------------------------------
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  // ------------------------------------------------------------
  // FILTERED USERS (LOCAL FILTERING)
  // ------------------------------------------------------------
  const filteredUsers = useMemo(() => {
    let result = allUsers;

    // Filter by status
    if (activeFilter !== "all") {
      result = result.filter((u) => u.status === activeFilter);
    }

    // Filter by search query
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

  // ------------------------------------------------------------
  // FETCH USERS FROM API
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // INITIAL DATA LOAD
  // ------------------------------------------------------------
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ------------------------------------------------------------
  // PULL TO REFRESH
  // ------------------------------------------------------------
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, [fetchUsers]);

  // ------------------------------------------------------------
  // GET STATUS COLOR
  // ------------------------------------------------------------
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return colors.success;
      case "inactive":
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  // ------------------------------------------------------------
  // GET ROLE COLOR
  // ------------------------------------------------------------
  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return colors.primary;
      case "user":
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  // ------------------------------------------------------------
  // FORMAT DATE
  // ------------------------------------------------------------
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ------------------------------------------------------------
  // GET COUNTS FOR TABS
  // ------------------------------------------------------------
  const getCounts = useMemo(() => {
    return {
      all: allUsers.length,
      active: allUsers.filter((u) => u.status === "active").length,
      inactive: allUsers.filter((u) => u.status === "inactive").length,
    };
  }, [allUsers]);

  // ------------------------------------------------------------
  // RENDER LOADING STATE
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // RENDER ERROR STATE
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // MAIN RENDER
  // ------------------------------------------------------------
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.md }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ========== HEADER ========== */}
        <Text style={[styles.title, { color: colors.text }]}>User Management</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, marginBottom: spacing.md }]}>
          {totalCount} total users in the system
        </Text>

        {/* ========== SEARCH BAR ========== */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              marginBottom: spacing.md,
              padding: spacing.sm,
              borderRadius: 8,
            },
          ]}
        >
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search users by name or email..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={[styles.clearButton, { color: colors.textMuted }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ========== FILTER TABS ========== */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: spacing.md }}
        >
          <View style={[styles.tabs, { gap: spacing.sm }]}>
            {(["all", "active", "inactive"] as FilterStatus[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveFilter(tab)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: activeFilter === tab ? colors.primary : colors.surface,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: 8,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: activeFilter === tab ? "#fff" : colors.textSecondary },
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} ({getCounts[tab]})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* ========== EMPTY STATE ========== */}
        {filteredUsers.length === 0 ? (
          <View style={[styles.emptyState, { padding: spacing.xl }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? "No users match your search" : "No users found"}
            </Text>
          </View>
        ) : (
          /* ========== USER LIST ========== */
          <View style={[styles.userList, { gap: spacing.sm }]}>
            {filteredUsers.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={[
                  styles.userCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    padding: spacing.md,
                    borderRadius: 12,
                  },
                ]}
                activeOpacity={0.7}
              >
                {/* ---- User Info Row ---- */}
                <View style={styles.userInfo}>
                  {/* Avatar */}
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: colors.primary,
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        marginRight: spacing.sm,
                      },
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {(user.displayName || user.email || "U")[0].toUpperCase()}
                    </Text>
                  </View>

                  {/* User Details */}
                  <View style={styles.userDetails}>
                    <Text style={[styles.userName, { color: colors.text }]}>
                      {user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown User"}
                    </Text>
                    <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                      {user.email}
                    </Text>
                  </View>

                  {/* Role Badge */}
                  <View
                    style={[
                      styles.roleBadge,
                      {
                        backgroundColor: getRoleColor(user.role) + "20",
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 4,
                        borderRadius: 4,
                      },
                    ]}
                  >
                    <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>
                      {user.role}
                    </Text>
                  </View>
                </View>

                {/* ---- Meta Row ---- */}
                <View style={[styles.metaRow, { marginTop: spacing.sm }]}>
                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusColor(user.status) + "20",
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 2,
                        borderRadius: 4,
                      },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(user.status) }]}>
                      {user.status}
                    </Text>
                  </View>

                  {/* Join Date */}
                  <Text style={[styles.dateText, { color: colors.textMuted }]}>
                    Joined {formatDate(user.createdAt)}
                  </Text>
                </View>

                {/* ---- Additional Info ---- */}
                {user.lastLoginAt && (
                  <View style={[styles.lastLoginRow, { marginTop: spacing.xs }]}>
                    <Text style={[styles.metaLabel, { color: colors.textMuted }]}>
                      Last login:
                    </Text>
                    <Text style={[styles.metaValue, { color: colors.textSecondary }]}>
                      {formatDate(user.lastLoginAt)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ============================================================
// STYLES
// ============================================================
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
    marginTop: 12,
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
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  clearButton: {
    fontSize: 14,
    paddingHorizontal: 8,
  },
  tabs: {
    flexDirection: "row",
  },
  tab: {},
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
  },
  userList: {},
  userCard: {
    borderWidth: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  userDetails: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 14,
  },
  roleBadge: {},
  roleText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {},
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  dateText: {
    fontSize: 11,
  },
  lastLoginRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 11,
    marginRight: 4,
  },
  metaValue: {
    fontSize: 11,
  },
});
