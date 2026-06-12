import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { chatService } from "../../services/chat.service";
import { useUnreadMessages } from "../../providers/UnreadMessagesProvider";
import type { ChatConversation } from "../../types/chat";
import type { RootStackParamList } from "../../navigation/types";

/**
 * Inbox for non-admin users. Lists every conversation the user is in (one
 * per real-admin / seller pair) with the last message preview, time, and
 * a per-row unread badge. Tap → ChatScreen for that conversation.
 *
 * Why this exists: the user used to have NO inbox — the only chat entry
 * point was SupportFab which always resolved to a single hardcoded admin.
 * When the admin started a new conversation with the user via
 * AdminUserDetailScreen, the new thread was invisible to the user. This
 * screen surfaces every thread on the user side.
 */
export const UserMessagesScreen = () => {
  const { colors, radius, spacing } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { totalUnread } = useUnreadMessages();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) setLoading(true);
      try {
        setError(null);
        const response = await chatService.listConversations();
        setConversations(response.conversations || []);
      } catch (err: any) {
        setError(err?.message || "Couldn't load your conversations.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // Initial + on-focus refresh so opening a chat and coming back updates
  // the per-row unread numbers immediately.
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);
  useFocusEffect(
    useCallback(() => {
      loadConversations({ silent: true });
    }, [loadConversations])
  );

  const handleOpen = useCallback(
    (conv: ChatConversation) => {
      navigation.navigate("Chat", {
        conversationId: conv.id,
        recipientId: conv.otherParticipant?.id,
        recipientName: conv.otherParticipant?.name || "Conversation",
        recipientPhone: conv.otherParticipant?.phone,
      });
    },
    [navigation]
  );

  const summary = useMemo(() => {
    if (loading) return "Loading conversations…";
    if (error) return error;
    if (conversations.length === 0) return "No conversations yet";
    return `${conversations.length} conversation${conversations.length === 1 ? "" : "s"} · ${totalUnread} unread`;
  }, [conversations.length, error, loading, totalUnread]);

  const renderItem = useCallback(
    ({ item }: { item: ChatConversation }) => {
      const unread = item.unreadCount || 0;
      const name = item.otherParticipant?.name || "Conversation";
      const initials = name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "C";
      const lastMessage = item.lastMessage || "Tap to view";
      const when = item.lastMessageAt
        ? new Date(item.lastMessageAt).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";

      return (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleOpen(item)}
          style={[
            styles.row,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              marginHorizontal: spacing.md,
              marginBottom: spacing.sm,
              padding: spacing.md,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.primarySoft, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
          </View>
          <View style={styles.content}>
            <View style={styles.headerLine}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {name}
              </Text>
              {when ? (
                <Text style={[styles.when, { color: colors.textMuted }]} numberOfLines={1}>
                  {when}
                </Text>
              ) : null}
            </View>
            <View style={styles.previewLine}>
              <Text
                style={[
                  styles.preview,
                  { color: unread > 0 ? colors.text : colors.textMuted, fontWeight: unread > 0 ? "700" : "500" },
                ]}
                numberOfLines={1}
              >
                {lastMessage}
              </Text>
              {unread > 0 ? (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.badgeText, { color: colors.textOnPrimary }]}>
                    {unread > 99 ? "99+" : String(unread)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [colors, handleOpen, radius, spacing]
  );

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { borderBottomColor: colors.border, paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
          {summary}
        </Text>
      </View>

      {loading && conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error && conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="warning-outline" size={28} color={colors.error} />
          <Text style={[styles.emptyText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={() => loadConversations()}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={32} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            You'll see your conversations here when someone messages you.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xxl }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void loadConversations({ silent: true });
              }}
              tintColor={colors.primary}
            />
          }
        />
      )}
      {/* user is kept in scope only to ensure the screen re-mounts on
          account switch — listConversations is server-keyed by JWT. */}
      {user ? null : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  subtitle: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  avatarText: { fontSize: 14, fontWeight: "800" },
  content: { flex: 1, gap: 4 },
  headerLine: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: "700" },
  when: { fontSize: 11, fontWeight: "600" },
  previewLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  preview: { flex: 1, fontSize: 13 },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 11, fontWeight: "800" },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyText: { fontSize: 13, fontWeight: "600", textAlign: "center", lineHeight: 18 },
  retryText: { fontSize: 14, fontWeight: "700", marginTop: 4 },
});
