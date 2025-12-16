import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking, Platform, KeyboardAvoidingView } from "react-native";
import { GiftedChat, IMessage, Bubble, InputToolbar, Send, Composer } from "react-native-gifted-chat";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { chatService } from "../../services/chat.service";
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
  const pollRef = useRef<NodeJS.Timeout | null>(null);

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
            name: msg.senderRole === "admin" ? "Admin" : "User",
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

    pollRef.current = setInterval(() => {
      loadMessages();
    }, 5000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [loadMessages]);

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      if (newMessages.length === 0) return;
      const messageText = newMessages[0].text;

      setMessages((prev) => GiftedChat.append(prev, newMessages));
      try {
        setSending(true);
        await chatService.sendMessage(conversationId, messageText);
        await loadMessages();
      } catch (err) {
        console.error("Error sending message:", err);
        Alert.alert("Error", "Failed to send message. Please try again.");
      } finally {
        setSending(false);
      }
    },
    [conversationId, loadMessages]
  );

  const handleCallUser = async () => {
    if (!userPhone) {
      Alert.alert("No Phone Number", "This user hasn't provided a phone number.");
      return;
    }

    const cleanedNumber = userPhone.replace(/[^\d+]/g, "");
    const phoneUrl = Platform.OS === "android" ? `tel:${cleanedNumber}` : `telprompt:${cleanedNumber}`;
    const startTime = new Date();

    try {
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert("Call User", `Phone: ${userPhone}`, [{ text: "OK" }]);
      }
    } catch (err) {
      console.error("Error opening phone:", err);
      Alert.alert("Error", "Could not open phone app.");
      return;
    }

    const durationOptions = [
      { label: "30 sec", seconds: 30 },
      { label: "1 min", seconds: 60 },
      { label: "5 min", seconds: 300 },
      { label: "Skip", seconds: 0 },
    ];

    Alert.alert(
      "Log Call Duration",
      "Select the call duration to log:",
      durationOptions.map((opt) => ({
        text: opt.label,
        onPress: async () => {
          if (!recipientId) {
            return;
          }
          try {
            await chatService.logCall({
              conversationId,
              calleeId: recipientId,
              startedAt: startTime,
              endedAt: opt.seconds ? new Date(startTime.getTime() + opt.seconds * 1000) : startTime,
              durationSeconds: opt.seconds,
            });
          } catch (error) {
            console.error("Failed to log call", error);
          }
        },
      }))
    );
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
          renderBubble={(props) => (
            <Bubble
              {...props}
              wrapperStyle={{
                right: { backgroundColor: colors.primary },
                left: { backgroundColor: colors.surface },
              }}
              textStyle={{
                right: { color: "#fff" },
                left: { color: colors.text },
              }}
            />
          )}
          renderInputToolbar={(props) => (
            <InputToolbar
              {...props}
              containerStyle={{
                borderTopWidth: 1,
                borderTopColor: colors.border,
                backgroundColor: colors.surface,
              }}
            />
          )}
          renderComposer={(props) => (
            <Composer
              {...props}
              textInputStyle={{
                color: colors.text,
              }}
              placeholderTextColor={colors.textMuted}
            />
          )}
          renderSend={(props) => (
            <Send {...props} disabled={sending} containerStyle={{ justifyContent: "center", alignItems: "center" }}>
              <Text style={[styles.sendText, { color: sending ? colors.textMuted : colors.primary }]}>Send</Text>
            </Send>
          )}
          isLoadingEarlier={sending}
          placeholder="Type a message..."
          alwaysShowSend
          scrollToBottom
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
