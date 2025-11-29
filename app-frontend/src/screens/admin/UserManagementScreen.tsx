import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useTheme } from "../../hooks/useTheme";

/**
 * User Management Screen
 * Allows admins to view and manage all users
 */
export const UserManagementScreen = () => {
  const { colors, spacing } = useTheme();

  // Placeholder data - will be replaced with API calls
  const users = [
    { id: "1", name: "John Doe", email: "john@example.com", role: "user", status: "active" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "user", status: "active" },
    { id: "3", name: "Bob Wilson", email: "bob@example.com", role: "admin", status: "active" },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { padding: spacing.md }]}
    >
      <Text style={[styles.title, { color: colors.text }]}>User Management</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
        Manage all users in the system
      </Text>

      {/* User List */}
      <View style={[styles.userList, { gap: spacing.sm }]}>
        {users.map((user) => (
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
          >
            <View style={styles.userInfo}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.primary, width: 40, height: 40, borderRadius: 20 },
                ]}
              >
                <Text style={styles.avatarText}>{user.name[0]}</Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
              </View>
            </View>
            <View style={styles.userMeta}>
              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor: user.role === "admin" ? colors.primary + "20" : colors.success + "20",
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 4,
                    borderRadius: 4,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roleText,
                    { color: user.role === "admin" ? colors.primary : colors.success },
                  ]}
                >
                  {user.role}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  userList: {},
  userCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  userDetails: {
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 14,
  },
  userMeta: {},
  roleBadge: {},
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
