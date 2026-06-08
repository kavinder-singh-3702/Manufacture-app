import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../hooks/useTheme";
import { useThemeMode } from "../../../hooks/useThemeMode";
import {
  adminService,
  AdminConversationQueueItem,
  Pagination,
} from "../../../services/admin.service";
import { AdminSearchBar, AdminListCard } from "../../../components/admin";
import { neuCardBg } from "../../../theme/neumorphic";
import { RootStackParamList } from "../../../navigation/types";
import { chatService } from "../../../services/chat.service";

const PAGE_SIZE = 25;

const formatDate = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

/**
 * Admin conversations list — lifted from AdminOpsConsoleScreen so the Messages
 * feature stays available now that CommandCenter is the canonical Ops surface.
 * Phase 5 of the rebuild replaces this with a proper AdminConversationViewer.
 */
export const MessagesTab = () => {
  const { colors, spacing, radius } = useTheme();
  const { resolvedMode } = useThemeMode();
  const isDark = resolvedMode === "dark";
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<AdminConversationQueueItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: PAGE_SIZE,
    offset: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(
    async ({ reset = true, offset }: { reset?: boolean; offset?: number } = {}) => {
      const nextOffset = reset ? 0 : offset ?? 0;
      try {
        setError(null);
        if (reset) setLoading(true);
        else setLoadingMore(true);

        const response = await adminService.listConversations({
          limit: PAGE_SIZE,
          offset: nextOffset,
          search: search.trim() || undefined,
          sort: "updatedAt:desc",
        });
        setConversations((previous) =>
          reset ? response.conversations : [...previous, ...response.conversations]
        );
        setPagination(response.pagination);
      } catch (err: any) {
        setError(err?.message || "Failed to load conversations");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search]
  );

  useFocusEffect(
    useCallback(() => {
      fetchConversations({ reset: true });
    }, [fetchConversations])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations({ reset: true }).finally(() => setRefreshing(false));
  }, [fetchConversations]);

  /**
   * Dedupe by `otherParticipant.id` — the backend can hold multiple
   * ChatConversation rows for the same pair (race conditions, legacy data,
   * and the test-admin path in getOrCreateConversation can all create dupes).
   * Showing 18 "Aditya Bhardwaj" rows is the symptom. We collapse them into
   * one row per person: pick the most recent thread for the row preview,
   * sum the unread counts, and surface a "+N threads" hint when extra rows
   * exist so the admin knows there is hidden state.
   */
  const dedupedConversations = useMemo(() => {
    const groups = new Map<
      string,
      { rep: AdminConversationQueueItem; totalUnread: number; threadCount: number }
    >();

    for (const conv of conversations) {
      const key = conv.otherParticipant?.id || conv.id;
      const existing = groups.get(key);
      const convTime = new Date(conv.lastMessageAt || conv.updatedAt || 0).getTime();

      if (!existing) {
        groups.set(key, {
          rep: conv,
          totalUnread: conv.unreadCount || 0,
          threadCount: 1,
        });
        continue;
      }

      const existingTime = new Date(
        existing.rep.lastMessageAt || existing.rep.updatedAt || 0
      ).getTime();

      groups.set(key, {
        rep: convTime > existingTime ? conv : existing.rep,
        totalUnread: existing.totalUnread + (conv.unreadCount || 0),
        threadCount: existing.threadCount + 1,
      });
    }

    return Array.from(groups.values()).sort((a, b) => {
      const at = new Date(a.rep.lastMessageAt || a.rep.updatedAt || 0).getTime();
      const bt = new Date(b.rep.lastMessageAt || b.rep.updatedAt || 0).getTime();
      return bt - at;
    });
  }, [conversations]);

  const openChatWithSiblings = useCallback(
    (conversation: AdminConversationQueueItem, siblingIds: string[]) => {
      // Phase 5 of the ops rebuild: admins read in the dedicated viewer screen,
      // not the user-facing Chat (which is a participant view with a composer
      // and looks like the admin "joined" the conversation).
      navigation.navigate("AdminConversation", {
        id: conversation.id,
        siblingIds: siblingIds.length > 0 ? siblingIds : undefined,
      });
    },
    [navigation]
  );

  const callUser = useCallback(async (phone?: string) => {
    if (!phone) {
      Alert.alert("No phone number", "This participant has no phone number.");
      return;
    }
    const cleaned = phone.replace(/[^\d+]/g, "");
    const url = `tel:${cleaned}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert("Call unavailable", phone);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("Call unavailable", phone);
    }
  }, []);

  type GroupedConversation = {
    rep: AdminConversationQueueItem;
    totalUnread: number;
    threadCount: number;
  };

  /**
   * Build a map from otherParticipant.id → all raw conversation ids in that
   * group, so opening a deduped row can mark every duplicate thread as read.
   * Without this, opening "Aditya Bhardwaj" only marks the most recent thread
   * read; older duplicate threads keep contributing unread → count never zeros.
   */
  const threadIdsByParticipant = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const conv of conversations) {
      const key = conv.otherParticipant?.id || conv.id;
      const list = map.get(key) || [];
      list.push(conv.id);
      map.set(key, list);
    }
    return map;
  }, [conversations]);

  const handleRowPress = useCallback(
    (rep: AdminConversationQueueItem) => {
      const groupKey = rep.otherParticipant?.id || rep.id;
      const allIds = threadIdsByParticipant.get(groupKey) || [rep.id];

      // Fire-and-forget markRead on every thread in the group. Errors are
      // tolerated — the viewer screen also re-marks on mount + after each send.
      void Promise.all(
        allIds.map((id) => chatService.markRead(id).catch(() => undefined))
      );

      // Pass the sibling ids through so the viewer can also markRead them on
      // every send. Without this, while admin is chatting in conversation #1
      // of N dupes, the user's app might send to conversation #3, leaving #3
      // with unread that doesn't drop until admin re-opens the tab.
      openChatWithSiblings(rep, allIds.filter((siblingId) => siblingId !== rep.id));
    },
    [openChatWithSiblings, threadIdsByParticipant]
  );

  const renderItem = useCallback(
    ({ item }: { item: GroupedConversation }) => {
      const { rep, totalUnread, threadCount } = item;
      const metaParts = [`Last activity ${formatDate(rep.lastMessageAt || rep.updatedAt)}`];
      if (threadCount > 1) metaParts.push(`+${threadCount - 1} older threads`);
      return (
        <View style={{ marginHorizontal: spacing.lg, marginBottom: spacing.sm }}>
          <AdminListCard
            title={rep.otherParticipant?.name || "Conversation"}
            subtitle={rep.lastMessage || "No message yet"}
            avatarText={(rep.otherParticipant?.name || "U")[0].toUpperCase()}
            status={{
              label: totalUnread ? `${totalUnread} unread` : "Read",
              type: totalUnread ? "warning" : "neutral",
            }}
            meta={metaParts.join(" • ")}
            onPress={() => handleRowPress(rep)}
            rightContent={
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => callUser(rep.otherParticipant?.phone)}
                style={[
                  styles.callButton,
                  { backgroundColor: colors.badgePrimary, borderRadius: radius.pill },
                ]}
              >
                <Ionicons name="call-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
            }
          />
        </View>
      );
    },
    [callUser, colors.badgePrimary, colors.primary, handleRowPress, radius.pill, spacing.lg, spacing.sm]
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View
              key={`s-${i}`}
              style={{
                height: 90,
                borderRadius: radius.lg,
                backgroundColor: colors.surface,
                opacity: 0.5,
              }}
            />
          ))}
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.error }]}>Failed to load conversations</Text>
          <Text style={[styles.emptyHint, { color: colors.textMuted }]}>{error}</Text>
          <Text
            style={[styles.retryLink, { color: colors.primary }]}
            onPress={() => fetchConversations({ reset: true })}
          >
            Retry
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No conversations</Text>
        <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
          {search.trim() ? "No conversations match your search." : "Active conversations will appear here."}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: neuCardBg(isDark) }]}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <AdminSearchBar value={search} onChangeText={setSearch} placeholder="Search conversations..." />
      </View>
      <FlatList
        data={dedupedConversations}
        keyExtractor={(item) => item.rep.otherParticipant?.id || item.rep.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: spacing.xxl }}
        ListEmptyComponent={renderEmpty()}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (pagination.hasMore && !loadingMore) {
            fetchConversations({ reset: false, offset: pagination.offset + pagination.limit });
          }
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  callButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyHint: { fontSize: 13, fontWeight: "500", textAlign: "center", lineHeight: 18 },
  retryLink: { marginTop: 12, fontSize: 14, fontWeight: "700" },
  footerLoader: { paddingVertical: 24, alignItems: "center" },
});
