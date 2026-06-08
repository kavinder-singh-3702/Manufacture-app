import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";

import { useTheme } from "../../hooks/useTheme";
import { RootStackParamList } from "../../navigation/types";
import {
  ADMIN_CONVERSATION_KEY,
  useAdminConversation,
  useAdminConversationMessages,
} from "../../hooks/queries/useAdminConversation";
import { AdminConversationMessage } from "../../services/admin.service";
import { chatService } from "../../services/chat.service";

type AdminConversationViewerRoute = RouteProp<RootStackParamList, "AdminConversation">;

/**
 * Admin-side read-only conversation viewer (Phase 5).
 *
 * Replaces the old AdminOpsConsoleScreen flow which navigated to the user-facing
 * Chat screen — wrong UI for moderation/audit (admin shouldn't appear to
 * "join" the conversation by entering the user chat). This screen renders the
 * full message history without a sendable composer.
 */
export const AdminConversationViewerScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<AdminConversationViewerRoute>();
  const insets = useSafeAreaInsets();

  const { id, siblingIds } = route.params;
  // Bundle id + siblings into one array so the markRead helper hits every
  // duplicate conversation between this admin and the other participant.
  // Until the prod DB merge cleanup runs, multiple rows per pair are possible
  // and unread leaks into siblings that the admin isn't currently viewing.
  const allConvIds = siblingIds && siblingIds.length > 0 ? [id, ...siblingIds] : [id];

  const markAllRead = useCallback(() => {
    void Promise.all(
      allConvIds.map((cid) => chatService.markRead(cid).catch(() => undefined))
    );
  }, [allConvIds]);

  const { conversation, isLoading: convLoading, refetch: refetchConv, error: convError } =
    useAdminConversation(id);
  const {
    messages,
    total,
    isLoading: messagesLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchMessages,
    error: messagesError,
  } = useAdminConversationMessages(id);

  const queryClient = useQueryClient();

  const [pulled, setPulled] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  // Locally optimistic messages — appended on send, replaced once the server
  // confirms. Lets the admin see their own reply instantly without waiting for
  // a refetch round-trip.
  const [pendingMessages, setPendingMessages] = useState<AdminConversationMessage[]>([]);

  // Mark every sibling conversation as read whenever the admin enters the
  // viewer. Without this, the MessagesTab unread badge keeps climbing because
  // a duplicate row continues to count messages with createdAt > its own
  // (stale) lastReadAt. Errors are swallowed — markRead is best-effort.
  useEffect(() => {
    if (!id) return;
    markAllRead();
    // Intentionally exclude `markAllRead` from deps — the helper depends on
    // allConvIds which is reference-stable per-mount. We want this to fire
    // exactly once per route params change, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handlePull = async () => {
    setPulled(true);
    try {
      await Promise.all([refetchConv(), refetchMessages()]);
    } finally {
      setPulled(false);
    }
  };

  // Pre-generate optimistic IDs so the FlatList key extractor stays stable
  // until the server returns the real id.
  const tempIdCounter = useRef(0);

  const handleSend = useCallback(async () => {
    const content = draft.trim();
    if (!content || sending || !id) return;
    const tempId = `pending-${tempIdCounter.current++}-${content.length}`;
    const optimistic: AdminConversationMessage = {
      id: tempId,
      conversationId: id,
      senderId: "admin",
      senderRole: "admin",
      content,
      timestamp: new Date(Date.now()).toISOString(),
      read: true,
    };
    setPendingMessages((prev) => [...prev, optimistic]);
    setDraft("");

    try {
      setSending(true);
      const response = await chatService.sendMessage(id, content);
      // Drop our optimistic placeholder; the next refetch (or a subsequent
      // markRead → invalidation) brings in the canonical record. We also
      // append the server message immediately so the user sees it even before
      // the refetch resolves.
      setPendingMessages((prev) => prev.filter((m) => m.id !== tempId));
      // Invalidate the messages query so the new record shows up authoritatively.
      queryClient.invalidateQueries({ queryKey: [...ADMIN_CONVERSATION_KEY, id, "messages"] });
      // Mark every sibling conversation as read — sending here implies the
      // admin has caught up on the WHOLE participant relationship, not just
      // the row they have open right now.
      markAllRead();
      // Swallow the response details — we only care that it succeeded.
      void response;
    } catch (_err) {
      // Roll the optimistic message back so the admin knows it didn't ship.
      setPendingMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(content);
    } finally {
      setSending(false);
    }
  }, [draft, id, markAllRead, queryClient, sending]);

  const otherName = conversation?.otherParticipant?.name || "Conversation";
  const otherPhone = conversation?.otherParticipant?.phone;
  const otherEmail = conversation?.otherParticipant?.email;

  const callOther = async () => {
    if (!otherPhone) return;
    const url = `tel:${otherPhone.replace(/[^\d+]/g, "")}`;
    const can = await Linking.canOpenURL(url).catch(() => false);
    if (can) Linking.openURL(url).catch(() => undefined);
  };

  const renderMessage = ({ item }: { item: AdminConversationMessage }) => {
    const isAdminSide = item.senderRole === "admin" || item.senderRole === "support";
    const tone = isAdminSide ? colors.primary : colors.surface;
    const textColor = isAdminSide ? colors.textOnPrimary : colors.text;
    return (
      <View
        style={[
          styles.bubble,
          {
            alignSelf: isAdminSide ? "flex-end" : "flex-start",
            backgroundColor: tone,
            borderRadius: radius.lg,
            marginHorizontal: spacing.lg,
            marginBottom: spacing.xs,
            maxWidth: "82%",
          },
        ]}
      >
        <Text style={[styles.bubbleText, { color: textColor }]} selectable>
          {item.content}
        </Text>
        <Text
          style={[
            styles.bubbleTime,
            { color: isAdminSide ? colors.textOnPrimary + "B0" : colors.textMuted },
          ]}
        >
          {formatTime(item.timestamp)} {isAdminSide ? "• Admin" : ""}
        </Text>
      </View>
    );
  };

  // Be resilient: as long as ONE of the two endpoints returned data, show
  // what we have. The detail endpoint (/admin/conversations/:id) is new in
  // phase 5 of the ops rebuild and may 404 in production during the deploy
  // window. The messages endpoint is older and likely available — fall back
  // to showing the message thread with a generic "Conversation" header.
  // Bug 5 defense: when both endpoints return 404 because no ChatMessage rows
  // exist YET (admin just lazy-created the conversation via getOrCreateConversation
  // and is about to send the first message), treat it as an empty thread
  // instead of showing "Couldn't load this conversation". The composer below
  // still lets the admin send the first message via POST .../messages, which
  // creates the message row server-side.
  const is404Like = (err: unknown): boolean => {
    if (!err || typeof err !== "object") return false;
    const status = (err as { status?: number; statusCode?: number }).status ??
      (err as { statusCode?: number }).statusCode;
    if (status === 404) return true;
    const message = (err as { message?: string }).message;
    return typeof message === "string" && /not found|resource not found/i.test(message);
  };

  const hasAnyData = Boolean(conversation) || messages.length > 0;
  const isLoading = (convLoading && messagesLoading) || (!hasAnyData && (convLoading || messagesLoading));
  const rawError = !hasAnyData ? (messagesError || convError) : null;
  // Suppress the error card when the only failure is "not found" AND no
  // messages exist — that's the empty-thread case, not a real error.
  const error =
    rawError && is404Like(rawError) && messages.length === 0
      ? null
      : rawError;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: insets.top + 8,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.sm,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.iconButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          activeOpacity={0.7}
          hitSlop={12}
        >
          <Text style={[styles.backIcon, { color: colors.text }]}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {otherName}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
            {otherEmail || "—"}
          </Text>
        </View>
        {otherPhone ? (
          <TouchableOpacity
            onPress={callOther}
            style={[styles.iconButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
            activeOpacity={0.7}
            hitSlop={12}
          >
            <Ionicons name="call-outline" size={18} color={colors.textOnPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.iconButton, { backgroundColor: "transparent", borderColor: "transparent" }]} />
        )}
      </View>

      {/* Body */}
      {isLoading && messages.length === 0 ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingHint, { color: colors.textMuted, marginTop: 12 }]}>
            Loading conversation...
          </Text>
        </View>
      ) : error && messages.length === 0 ? (
        <View style={[styles.loadingState, { padding: spacing.lg }]}>
          <Ionicons name="alert-circle-outline" size={28} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text, marginTop: 8 }]}>
            Couldn't load this conversation
          </Text>
          <Text style={[styles.loadingHint, { color: colors.textMuted, textAlign: "center", marginTop: 6 }]}>
            {(error as Error)?.message || "Tap retry to try again."}
          </Text>
          <TouchableOpacity
            onPress={() => {
              refetchConv();
              refetchMessages();
            }}
            style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: radius.md, marginTop: 14 }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.retryButtonText, { color: colors.textOnPrimary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <FlatList
            data={[...messages, ...pendingMessages]}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            inverted={false}
            contentContainerStyle={{
              paddingVertical: spacing.md,
              paddingBottom: spacing.sm,
              flexGrow: 1,
            }}
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No messages yet</Text>
                <Text style={[styles.loadingHint, { color: colors.textMuted, textAlign: "center", marginTop: 6 }]}>
                  Start the conversation below.
                </Text>
              </View>
            }
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            refreshControl={
              <RefreshControl refreshing={pulled} onRefresh={handlePull} tintColor={colors.primary} />
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={{ paddingVertical: 16, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : !hasNextPage && messages.length > 0 ? (
                <View style={{ paddingVertical: 16, alignItems: "center" }}>
                  <Text style={[styles.loadingHint, { color: colors.textMuted }]}>
                    Showing {messages.length} of {total}
                  </Text>
                </View>
              ) : null
            }
          />

          {/* Composer */}
          <View
            style={[
              styles.composer,
              {
                backgroundColor: colors.surfaceElevated,
                borderTopColor: colors.border,
                paddingHorizontal: spacing.md,
                paddingTop: spacing.sm,
                paddingBottom: Math.max(insets.bottom, spacing.sm),
              },
            ]}
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Reply as admin..."
              placeholderTextColor={colors.textMuted}
              multiline
              style={[
                styles.composerInput,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderRadius: radius.md,
                  borderColor: colors.border,
                },
              ]}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!draft.trim() || sending}
              style={[
                styles.sendButton,
                {
                  backgroundColor: !draft.trim() || sending ? colors.textMuted : colors.primary,
                  borderRadius: radius.md,
                },
              ]}
              activeOpacity={0.85}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.textOnPrimary} />
              ) : (
                <Ionicons name="send" size={18} color={colors.textOnPrimary} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

const formatTime = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  backIcon: { fontSize: 28, fontWeight: "700", marginLeft: -2 },
  headerTitle: { fontSize: 16, fontWeight: "800", letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  bubble: { padding: 12, gap: 4 },
  bubbleText: { fontSize: 14, fontWeight: "500", lineHeight: 20 },
  bubbleTime: { fontSize: 10, fontWeight: "700", marginTop: 4 },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingHint: { fontSize: 13, fontWeight: "600" },
  errorTitle: { fontSize: 15, fontWeight: "800" },
  emptyTitle: { fontSize: 15, fontWeight: "800" },
  retryButton: { paddingHorizontal: 22, paddingVertical: 12 },
  retryButtonText: { fontSize: 14, fontWeight: "800" },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: "500",
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyMessages: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
});
