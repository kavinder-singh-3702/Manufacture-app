import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Linking, Alert, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { chatService } from "../../services/chat.service";
import { getChatSocket, ChatMessageEvent, ChatReadEvent } from "../../services/chatSocket";
import type { ChatConversation } from "../../types/chat";
import type { RootStackParamList } from "../../navigation/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const AdminChatScreen = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { colors, spacing, radius } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const loadConversations = useCallback(async () => {
    try {
      setError(null);
      const response = await chatService.listConversations();
      setConversations(response.conversations);
    } catch (err: any) {
      console.error("Failed to load conversations", err);
      setError(err.message || "Failed to load conversations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    let isMounted = true;
    let socketCleanup: (() => void) | null = null;

    const upsertConversation = (summary: ChatConversation) => {
      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === summary.id);
        if (existingIndex === -1) {
          return [summary, ...prev];
        }
        const next = [...prev];
        const merged = { ...next[existingIndex], ...summary };
        next.splice(existingIndex, 1);
        next.unshift(merged);
        return next;
      });
    };

    const handleMessage = (payload: ChatMessageEvent) => {
      if (payload.conversation) {
        upsertConversation(payload.conversation);
      }
    };

    const handleRead = (payload: ChatReadEvent) => {
      if (payload.conversation) {
        upsertConversation(payload.conversation);
      }
    };

    (async () => {
      try {
        if (!user?.id) return;
        const socket = await getChatSocket();
        if (!isMounted) return;
        socket.on("chat:message", handleMessage);
        socket.on("chat:read", handleRead);
        socketCleanup = () => {
          socket.off("chat:message", handleMessage);
          socket.off("chat:read", handleRead);
        };
      } catch (error: any) {
        console.warn("Chat socket connection failed", error?.message || error);
      }
    })();

    return () => {
      isMounted = false;
      if (socketCleanup) socketCleanup();
    };
  }, [user?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const handleOpenChat = (conversation: ChatConversation) => {
    navigation.navigate("Chat", {
      conversationId: conversation.id,
      recipientId: conversation.otherParticipant?.id,
      recipientName: conversation.otherParticipant?.name || "User",
      recipientPhone: conversation.otherParticipant?.phone,
    });
  };

  const handleCallUser = async (conversation: ChatConversation) => {
    const phone = conversation.otherParticipant?.phone;
    console.log("[AdminChatScreen] handleCallUser - phone:", phone);

    if (!phone) {
      Alert.alert("No Phone Number", "This user hasn't provided a phone number.");
      return;
    }

    const cleanedNumber = phone.replace(/[^\d+]/g, "");
    const phoneUrl = Platform.OS === "android" ? `tel:${cleanedNumber}` : `telprompt:${cleanedNumber}`;

    console.log("[AdminChatScreen] Calling:", phoneUrl);

    try {
      const supported = await Linking.canOpenURL(phoneUrl);
      console.log("[AdminChatScreen] canOpen:", supported);

      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        // Fallback: try opening directly without checking
        await Linking.openURL(phoneUrl);
      }
    } catch (err) {
      console.error("Error opening phone:", err);
      Alert.alert("Call User", `Phone: ${phone}`, [{ text: "OK" }]);
    }
  };

  const renderItem = ({ item }: { item: ChatConversation }) => {
    const displayName = item.otherParticipant?.name || "User";
    const phone = item.otherParticipant?.phone;
    return (
      <TouchableOpacity
        onPress={() => handleOpenChat(item)}
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.md,
            padding: spacing.md,
            marginBottom: spacing.sm,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
              {displayName}
            </Text>
            {phone ? (
              <Text style={[styles.subtext, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
                {phone}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => handleCallUser(item)} style={styles.callButton}>
            <Text style={[styles.callIcon, { color: colors.primary }]}>📞</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.lastMessage, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
            {item.lastMessage || "Start the conversation"}
          </Text>
          {item.unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["rgba(108, 99, 255, 0.06)", "transparent"]} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { padding: spacing.lg, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
          {conversations.length} conversation{conversations.length === 1 ? "" : "s"}
        </Text>
      </View>

      {error && (
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: colors.error + "20", margin: spacing.md, padding: spacing.md, borderRadius: radius.md },
          ]}
        >
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No conversations yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Start chatting with users to see them here.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  loadingText: { fontSize: 14, fontWeight: "500" },
  header: { borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: "800" },
  headerSubtitle: { fontSize: 14, fontWeight: "500" },
  card: { borderWidth: 1 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  name: { fontSize: 16, fontWeight: "700" },
  subtext: { fontSize: 12, fontWeight: "500" },
  callButton: { padding: 8 },
  callIcon: { fontSize: 18 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  lastMessage: { fontSize: 13, flex: 1, marginRight: 8 },
  badge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  errorContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  errorText: { fontSize: 14, fontWeight: "500" },
  retryText: { fontSize: 14, fontWeight: "600" },
  emptyIcon: { fontSize: 42 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, fontWeight: "500", textAlign: "center", paddingHorizontal: 24 },
});
