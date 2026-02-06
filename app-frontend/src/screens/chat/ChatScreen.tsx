import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking, Platform, KeyboardAvoidingView, Keyboard } from "react-native";
import { GiftedChat, IMessage, Bubble, Send, Composer, InputToolbar } from "react-native-gifted-chat";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { chatService } from "../../services/chat.service";
import { getChatSocket, ChatMessageEvent } from "../../services/chatSocket";
import type { RootStackParamList } from "../../navigation/types";
import type { ChatMessage } from "../../types/chat";

type ChatScreenRouteProp = RouteProp<RootStackParamList, "Chat">;
type ChatScreenNavProp = NativeStackNavigationProp<RootStackParamList, "Chat">;

export const ChatScreen = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [recipientId, setRecipientId] = useState<string | undefined>(undefined);

  const { colors, spacing } = useTheme();
  const { user } = useAuth();
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

  const loadMessages = useCallback(async () => {
    try {
      const response = await chatService.getMessages(conversationId, { limit: 100 });
      const giftedMessages: IMessage[] = response.messages
        .map((msg: ChatMessage) => ({
          _id: msg.id,
          text: msg.content,
          createdAt: new Date(msg.timestamp),
          user: {
            _id: msg.senderId,
            name: msg.senderRole === "admin" ? "Admin" : msg.senderRole === "support" ? "Support" : "User",
          },
        }))
        .reverse();
      setMessages(giftedMessages);
      await chatService.markRead(conversationId);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    setLoading(true);
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    let isMounted = true;
    let socketCleanup: (() => void) | null = null;

    const handleIncoming = (payload: ChatMessageEvent) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.message.senderId === currentUser._id) return;

      const senderName =
        payload.message.senderRole === "admin"
          ? "Admin"
          : payload.message.senderRole === "support"
          ? "Support"
          : "User";

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
        return GiftedChat.append(prev, [incoming]);
      });

      chatService.markRead(conversationId).catch((err) => {
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
      const messageText = newMessages[0].text;

      // Optimistically add message to UI
      setMessages((prev) => GiftedChat.append(prev, newMessages));

      // Dismiss keyboard after sending (like WhatsApp)
      Keyboard.dismiss();

      try {
        setSending(true);
        await chatService.sendMessage(conversationId, messageText);
        // Refresh messages from server
        await loadMessages();
      } catch (err) {
        console.error("Error sending message:", err);
        Alert.alert("Error", "Failed to send message. Please try again.");
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((msg) => msg._id !== newMessages[0]._id));
      } finally {
        setSending(false);
      }
    },
    [conversationId, loadMessages]
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
      <LinearGradient colors={["rgba(108, 99, 255, 0.06)", "transparent"]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.header, { borderBottomColor: colors.border, padding: spacing.lg }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backButton, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{recipientName}</Text>
            {userPhone && (
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
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
          user={currentUser}
          renderBubble={(props) => {
            const { key, ...bubbleProps } = props as any;
            return (
              <Bubble
                key={key}
                {...bubbleProps}
                wrapperStyle={{
                  right: { backgroundColor: colors.primary },
                  left: { backgroundColor: colors.surface },
                }}
                textStyle={{
                  right: { color: "#fff" },
                  left: { color: colors.text },
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
                  backgroundColor: colors.surface,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                }}
              />
            );
          }}
          renderComposer={(props) => {
            const { key, ...composerProps } = props as any;
            return (
              <View style={{
                flex: 1,
                backgroundColor: '#1E1E1E',
                borderRadius: 20,
                marginRight: 8,
                paddingHorizontal: 4,
              }}>
                <Composer
                  key={key}
                  {...composerProps}
                  textInputStyle={{
                    color: '#FFFFFF',
                    backgroundColor: 'transparent',
                    paddingTop: 10,
                    paddingBottom: 10,
                    paddingLeft: 10,
                    paddingRight: 10,
                    fontSize: 15,
                    marginTop: 0,
                    marginBottom: 0,
                  }}
                  placeholderTextColor="#888888"
                  textInputProps={{
                    style: {
                      color: '#FFFFFF',
                      fontSize: 15,
                    }
                  }}
                />
              </View>
            );
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
      </KeyboardAvoidingView>
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
