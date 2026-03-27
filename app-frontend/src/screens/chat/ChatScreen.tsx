import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking, Platform, Keyboard } from "react-native";
import { GiftedChat, IMessage, Bubble, Send, InputToolbar } from "react-native-gifted-chat";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { chatService } from "../../services/chat.service";
import { getChatSocket, ChatMessageEvent } from "../../services/chatSocket";
import { useUnreadMessages } from "../../providers/UnreadMessagesProvider";
import type { RootStackParamList } from "../../navigation/types";
import type { ChatMessage } from "../../types/chat";

type ChatScreenRouteProp = RouteProp<RootStackParamList, "Chat">;
type ChatScreenNavProp = NativeStackNavigationProp<RootStackParamList, "Chat">;
const PAGE_SIZE = 50;

const getSenderName = (role: ChatMessage["senderRole"]): string => {
  if (role === "admin") return "Admin";
  if (role === "support") return "Support";
  return "User";
};

const toGiftedMessage = (msg: ChatMessage): IMessage => ({
  _id: msg.id,
  text: msg.content,
  createdAt: new Date(msg.timestamp),
  user: {
    _id: msg.senderId,
    name: getSenderName(msg.senderRole),
  },
});

const normalizeGiftedOrder = (items: IMessage[]): IMessage[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = String(item._id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

export const ChatScreen = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [sending, setSending] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [recipientId, setRecipientId] = useState<string | undefined>(undefined);

  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const { refresh: refreshUnread } = useUnreadMessages();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ChatScreenNavProp>();
  const route = useRoute<ChatScreenRouteProp>();

  const { conversationId, recipientName, recipientPhone, recipientId: recipientIdParam } = route.params;

  const currentUser = useMemo(
    () => ({
      _id: user?.id || "user-guest",
      name: user?.displayName || user?.email || "User",
    }),
    [user]
  );

  useEffect(() => {
    if (recipientPhone) setUserPhone(recipientPhone);
    if (recipientIdParam) setRecipientId(recipientIdParam);
  }, [recipientPhone, recipientIdParam]);

  const loadInitialMessages = useCallback(async () => {
    try {
      const response = await chatService.getMessages(conversationId, {
        limit: PAGE_SIZE,
        offset: 0,
      });
      const giftedMessages: IMessage[] = response.messages
        .map((msg: ChatMessage) => toGiftedMessage(msg))
        .reverse();
      setMessages(normalizeGiftedOrder(giftedMessages));
      setNextOffset(response.messages.length);
      setHasMoreHistory(Boolean(response.pagination?.hasMore));
      await chatService.markRead(conversationId);
      refreshUnread();
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const loadEarlierMessages = useCallback(async () => {
    if (!hasMoreHistory || loadingEarlier) return;
    setLoadingEarlier(true);
    try {
      const response = await chatService.getMessages(conversationId, {
        limit: PAGE_SIZE,
        offset: nextOffset,
      });
      const olderMessages = response.messages.map((msg) => toGiftedMessage(msg)).reverse();
      setMessages((prev) => normalizeGiftedOrder([...prev, ...olderMessages]));
      setNextOffset((prev) => prev + response.messages.length);
      setHasMoreHistory(Boolean(response.pagination?.hasMore));
    } catch (err) {
      console.error("Error loading older messages:", err);
    } finally {
      setLoadingEarlier(false);
    }
  }, [conversationId, hasMoreHistory, loadingEarlier, nextOffset]);

  useEffect(() => {
    setLoading(true);
    setLoadingEarlier(false);
    setHasMoreHistory(false);
    setNextOffset(0);
    setMessages([]);
    loadInitialMessages();
  }, [loadInitialMessages]);

  useEffect(() => {
    let isMounted = true;
    let socketCleanup: (() => void) | null = null;

    const handleIncoming = (payload: ChatMessageEvent) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.message.senderId === currentUser._id) return;

      const senderName =
        payload.message.senderRole === "admin" ? "Admin" : payload.message.senderRole === "support" ? "Support" : "User";

      setMessages((prev) => {
        const exists = prev.some((msg) => String(msg._id) === payload.message.id);
        if (exists) return prev;
        const incoming: IMessage = {
          _id: payload.message.id,
          text: payload.message.content,
          createdAt: new Date(payload.message.timestamp),
          user: {
            _id: payload.message.senderId,
            name: senderName,
          },
        };
        return normalizeGiftedOrder(GiftedChat.append(prev, [incoming]));
      });

      chatService.markRead(conversationId).then(() => refreshUnread()).catch((err) => {
        console.warn("Failed to mark chat as read", err?.message || err);
      });
    };

    (async () => {
      try {
        const socket = await getChatSocket();
        if (!isMounted) return;
        socket.on("chat:message", handleIncoming);
        socketCleanup = () => {
          socket.off("chat:message", handleIncoming);
        };
      } catch (error: any) {
        console.warn("Chat socket connection failed", error?.message || error);
      }
    })();

    return () => {
      isMounted = false;
      if (socketCleanup) socketCleanup();
    };
  }, [conversationId, currentUser._id]);

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      if (newMessages.length === 0) return;
      const optimisticMessage = newMessages[0];
      const messageText = optimisticMessage.text;
      const optimisticId = String(optimisticMessage._id);

      // Optimistically add message to UI
      setMessages((prev) => normalizeGiftedOrder(GiftedChat.append(prev, newMessages)));

      // Dismiss keyboard after sending (like WhatsApp)
      Keyboard.dismiss();

      try {
        setSending(true);
        const response = await chatService.sendMessage(conversationId, messageText);
        const delivered = response?.message ? toGiftedMessage(response.message) : null;
        setMessages((prev) => {
          const withoutOptimistic = prev.filter((msg) => String(msg._id) !== optimisticId);
          if (!delivered) return withoutOptimistic;
          return normalizeGiftedOrder(GiftedChat.append(withoutOptimistic, [delivered]));
        });
        chatService.markRead(conversationId).then(() => refreshUnread()).catch((err) => {
          console.warn("Failed to mark chat as read", err?.message || err);
        });
      } catch (err) {
        console.error("Error sending message:", err);
        Alert.alert("Error", "Failed to send message. Please try again.");
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((msg) => String(msg._id) !== optimisticId));
      } finally {
        setSending(false);
      }
    },
    [conversationId]
  );

  const handleCallUser = async () => {
    console.log("[ChatScreen] handleCallUser - userPhone:", userPhone, "recipientPhone:", recipientPhone);

    const phoneToCall = userPhone || recipientPhone;

    if (!phoneToCall) {
      Alert.alert("No Phone Number", "This user hasn't provided a phone number.");
      return;
    }

    const cleanedNumber = phoneToCall.replace(/[^\d+]/g, "");
    const phoneUrl = Platform.OS === "android" ? `tel:${cleanedNumber}` : `telprompt:${cleanedNumber}`;

    console.log("[ChatScreen] Calling:", phoneUrl);

    try {
      const canOpen = await Linking.canOpenURL(phoneUrl);
      console.log("[ChatScreen] canOpen:", canOpen);

      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        // Fallback: try opening directly without checking
        await Linking.openURL(phoneUrl);
      }
    } catch (err) {
      console.error("Error opening phone:", err);
      Alert.alert("Call User", `Phone: ${phoneToCall}`, [{ text: "OK" }]);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["rgba(108, 99, 255, 0.06)", "transparent"]} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View style={[styles.header, { borderBottomColor: colors.border, padding: spacing.lg }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backButton, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{recipientName}</Text>
            {userPhone && (
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
                {userPhone}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={handleCallUser}>
            <Text style={[styles.callButton, { color: colors.primary }]}>📞</Text>
          </TouchableOpacity>
        </View>

        <GiftedChat
          messages={messages}
          onSend={onSend}
          loadEarlier={hasMoreHistory}
          onLoadEarlier={loadEarlierMessages}
          isLoadingEarlier={loadingEarlier}
          user={currentUser}
          bottomOffset={insets.bottom}
          renderBubble={(props) => {
            const { key, ...bubbleProps } = props as any;
            return (
              <Bubble
                key={key}
                {...bubbleProps}
                wrapperStyle={{
                  right: {
                    backgroundColor: colors.primary,
                    borderRadius: 18,
                    borderBottomRightRadius: 4,
                    marginRight: 8,
                    marginLeft: 60,
                    marginVertical: 2,
                    paddingRight: 2,
                  },
                  left: {
                    backgroundColor: colors.surface,
                    borderRadius: 18,
                    borderBottomLeftRadius: 4,
                    marginLeft: 8,
                    marginRight: 60,
                    marginVertical: 2,
                    paddingLeft: 2,
                  },
                }}
                textStyle={{
                  right: { color: "#fff", fontSize: 15, lineHeight: 20 },
                  left: { color: colors.text, fontSize: 15, lineHeight: 20 },
                }}
                timeTextStyle={{
                  right: { color: "rgba(255,255,255,0.6)", fontSize: 11 },
                  left: { color: colors.textMuted, fontSize: 11 },
                }}
              />
            );
          }}
          renderInputToolbar={(props) => {
            const { key, ...toolbarProps } = props as any;
            return (
              <InputToolbar
                key={key}
                {...toolbarProps}
                containerStyle={{
                  backgroundColor: colors.background,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingTop: 6,
                  paddingBottom: Platform.OS === "ios" ? 12 : 6,
                  paddingHorizontal: 8,
                }}
                primaryStyle={{
                  alignItems: "center",
                }}
              />
            );
          }}
          textInputStyle={{
            color: colors.text,
            backgroundColor: colors.surface,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: colors.border,
            paddingTop: 10,
            paddingBottom: 10,
            paddingHorizontal: 14,
            fontSize: 15,
          }}
          textInputProps={{
            placeholderTextColor: colors.textMuted,
          }}
          renderSend={(props) => {
            const { key, ...sendProps } = props as any;
            return (
              <Send
                key={key}
                {...sendProps}
                disabled={sending}
                containerStyle={{
                  justifyContent: "center",
                  alignItems: "center",
                  paddingLeft: 8,
                  paddingRight: 4,
                }}
              >
                <View style={{
                  backgroundColor: sending ? '#666666' : colors.primary,
                  borderRadius: 20,
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                    {sending ? '...' : 'Send'}
                  </Text>
                </View>
              </Send>
            );
          }}
          placeholder="Type a message..."
          alwaysShowSend
          scrollToBottom
          scrollToBottomComponent={() => (
            <View style={{
              backgroundColor: colors.primary,
              borderRadius: 15,
              width: 30,
              height: 30,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
            }}>
              <Text style={{ color: '#FFF', fontSize: 18 }}>↓</Text>
            </View>
          )}
          infiniteScroll
          keyboardShouldPersistTaps="handled"
          listViewProps={{
            keyboardDismissMode: 'on-drag',
            keyboardShouldPersistTaps: 'handled',
          }}
        />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, fontWeight: "500" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1 },
  backButton: { fontSize: 16, fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSubtitle: { fontSize: 12, fontWeight: "500" },
  callButton: { fontSize: 22 },
  sendText: { fontSize: 16, fontWeight: "700", paddingHorizontal: 12, paddingVertical: 6 },
});
