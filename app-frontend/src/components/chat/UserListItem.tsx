/**
 * UserListItem Component
 *
 * Displays a single user in the admin's user list for starting/viewing chats.
 *
 * HOW IT WORKS:
 * - Shows user's avatar (or initials), name, email, and company
 * - Shows unread message count as a badge if there are unread messages
 * - Shows "Chat" or "New Chat" button depending on if conversation exists
 * - When pressed, calls onPress to open the chat
 */

import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../hooks/useTheme";
import type { ChatUser } from "../../types/chat";

type UserListItemProps = {
  user: ChatUser;
  onPress: () => void;
};

// Get initials from name (e.g., "Rahul Sharma" -> "RS")
const getInitials = (name: string): string => {
  const words = name.trim().split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const UserListItem = ({ user, onPress }: UserListItemProps) => {
  const { colors, spacing, radius } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Left side: Avatar + User Info */}
      <View style={styles.leftContent}>
        {/* Avatar with initials */}
        <LinearGradient
          colors={user.hasActiveConversation ? ["#19B8E6", "#148DB2"] : ["#3A3D4A", "#2E3138"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.avatar, { borderRadius: radius.lg }]}
        >
          <Text style={styles.avatarText}>{getInitials(user.displayName)}</Text>
        </LinearGradient>

        {/* User info */}
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
              {user.displayName}
            </Text>
            {/* Unread badge */}
            {user.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {user.unreadCount > 9 ? "9+" : user.unreadCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.userEmail, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
            {user.email}
          </Text>
          {user.companyName && (
            <Text style={[styles.companyName, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
              {user.companyName}
            </Text>
          )}
        </View>
      </View>

      {/* Right side: Action button */}
      <View style={styles.actionContainer}>
        <LinearGradient
          colors={user.hasActiveConversation ? ["#10B981", "#059669"] : ["#19B8E6", "#148DB2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.actionButton, { borderRadius: radius.sm }]}
        >
          <Text style={styles.actionButtonText}>
            {user.hasActiveConversation ? "Chat" : "New Chat"}
          </Text>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  leftContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  companyName: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  unreadBadge: {
    backgroundColor: "#FF4757",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  actionContainer: {
    marginLeft: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
