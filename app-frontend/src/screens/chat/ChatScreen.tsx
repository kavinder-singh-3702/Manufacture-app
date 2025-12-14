/**
 * ChatScreen
 *
 * Real-time chat using Firebase Firestore + Gifted Chat UI.
 *
 * HOW IT WORKS:
 * - Uses Firebase Firestore for real-time message sync
 * - Uses Gifted Chat for the beautiful UI
 * - Admin can call users by tapping the phone button
 *
 * FEATURES:
 * - Real-time messages (no refresh needed)
 * - Phone call button for admin (opens phone app)
 * - Beautiful message bubbles
 * - Typing indicator
 */

import { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking, Platform, KeyboardAvoidingView } from "react-native";
import { GiftedChat, IMessage, Bubble, InputToolbar, Send, Composer } from "react-native-gifted-chat";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { firebaseChatService } from "../../services/firebase-chat.service";
import { chatService } from "../../services/chat.service"; // Fallback for mock data
import type { RootStackParamList } from "../../navigation/types";

type ChatScreenRouteProp = RouteProp<RootStackParamList, "Chat">;
type ChatScreenNavProp = NativeStackNavigationProp<RootStackParamList, "Chat">;

// Configuration - Firebase is now enabled!
const USE_FIREBASE = true; // Firebase is configured and ready

export const ChatScreen = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);

  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<ChatScreenNavProp>();
  const route = useRoute<ChatScreenRouteProp>();

  // Get params from navigation (phone is passed for admin to call)
  const { conversationId, recipientName, recipientPhone } = route.params;

  // Determine if current user is admin
  const isAdmin = user?.role === "admin";

  // Current user for Gifted Chat
  const currentUser = {
    _id: isAdmin ? "admin-001" : (user?.id || "user-001"),
    name: isAdmin ? "Support Admin" : (user?.displayName || "User"),
  };

  // Set phone number from navigation params
  useEffect(() => {
    if (recipientPhone) {
      setUserPhone(recipientPhone);
    }
  }, [recipientPhone]);

  // Load messages and set up real-time listener
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupChat = async () => {
      try {
        setLoading(true);

        if (USE_FIREBASE) {
          // FIREBASE MODE: Real-time updates
          // Get conversation details (for phone number)
          const conversation = await firebaseChatService.getConversation(conversationId);
          if (conversation?.userPhone) {
            setUserPhone(conversation.userPhone);
          }

          // Subscribe to real-time messages
          unsubscribe = firebaseChatService.subscribeToMessages(
            conversationId,
            currentUser._id as string,
            (newMessages) => {
              setMessages(newMessages);
              setLoading(false);
            }
          );

          // Mark as read - different for admin vs user
          if (isAdmin) {
            await firebaseChatService.markAsRead(conversationId);
          } else {
            await firebaseChatService.markAsReadForUser(conversationId);
          }
        } else {
          // MOCK MODE: Use local mock data
          const response = await chatService.getMessages(conversationId);
          const giftedMessages: IMessage[] = response.messages
            .map((msg) => ({
              _id: msg.id,
              text: msg.content,
              createdAt: new Date(msg.timestamp),
              user: {
                _id: msg.senderId,
                name: msg.senderName,
              },
            }))
            .reverse();

          setMessages(giftedMessages);
          setLoading(false);

          // Set mock phone number for testing
          setUserPhone("+919876543210");
        }
      } catch (err) {
        console.error("Error setting up chat:", err);
        setLoading(false);
      }
    };

    setupChat();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [conversationId]);

  // Handle sending a message
  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      if (newMessages.length === 0) return;

      const messageText = newMessages[0].text;

      // Optimistically add to UI immediately
      setMessages((prev) => GiftedChat.append(prev, newMessages));

      try {
        setSending(true);

        if (USE_FIREBASE) {
          // FIREBASE MODE
          await firebaseChatService.sendMessage(
            conversationId,
            currentUser._id as string,
            currentUser.name,
            isAdmin ? "admin" : "user",
            messageText
          );
        } else {
          // MOCK MODE
          const senderRole = isAdmin ? "admin" : "user";
          await chatService.sendMessage(conversationId, messageText, senderRole);
        }
      } catch (err) {
        console.error("Error sending message:", err);
        Alert.alert("Error", "Failed to send message. Please try again.");
      } finally {
        setSending(false);
      }
    },
    [conversationId, isAdmin, currentUser]
  );

  /**
   * Handle phone call button press
   * Opens the phone app with the user's number
   */
  const handleCallUser = async () => {
    if (!userPhone) {
      Alert.alert("No Phone Number", "This user hasn't provided a phone number.");
      return;
    }

    // Clean the phone number (remove spaces, dashes, etc.)
    const cleanedNumber = userPhone.replace(/[^\d+]/g, "");

    // Create the phone URL
    const phoneUrl = Platform.OS === "android"
      ? `tel:${cleanedNumber}`
      : `telprompt:${cleanedNumber}`;

    try {
      const canOpen = await Linking.canOpenURL(phoneUrl);

      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        // If can't open phone app, copy number to clipboard
        Alert.alert(
          "Call User",
          `Phone: ${userPhone}\n\nUnable to open phone app. The number has been shown above.`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error opening phone app:", error);
      Alert.alert("Error", "Could not open phone app.");
    }
  };

  // Go back
  const handleGoBack = () => {
    navigation.goBack();
  };

  // Custom bubble styling
  const renderBubble = (props: any) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: {
          backgroundColor: "#6C63FF",
          borderRadius: 12,
          borderTopRightRadius: 4,
        },
        left: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          borderTopLeftRadius: 4,
          borderWidth: 1,
          borderColor: colors.border,
        },
      }}
      textStyle={{
        right: { color: "#FFFFFF" },
        left: { color: colors.text },
      }}
      timeTextStyle={{
        right: { color: "rgba(255,255,255,0.7)" },
        left: { color: colors.textMuted },
      }}
    />
  );

  // Custom input toolbar
  const renderInputToolbar = (props: any) => (
    <InputToolbar
      {...props}
      containerStyle={{
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    />
  );

  // Custom composer (text input)
  const renderComposer = (props: any) => (
    <Composer
      {...props}
      textInputStyle={{
        backgroundColor: colors.background,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        marginRight: 8,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
      }}
      placeholderTextColor={colors.textMuted}
    />
  );

  // Custom send button
  const renderSend = (props: any) => (
    <Send {...props} containerStyle={{ justifyContent: "center", paddingHorizontal: 8 }}>
      <LinearGradient
        colors={["#6C63FF", "#5248E6"]}
        style={{
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Send</Text>
      </LinearGradient>
    </Send>
  );

  // Loading state
  if (loading) {
    return (
      <LinearGradient colors={["#0F1115", "#101318", "#0F1115"]} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading messages...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0F1115", "#101318", "#0F1115"]} style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "transparent" }}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            },
          ]}
        >
          {/* Back button */}
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>

          {/* Recipient info */}
          <View style={styles.headerInfo}>
            <Text style={[styles.recipientName, { color: colors.text }]}>{recipientName}</Text>
            <Text style={[styles.chatStatus, { color: colors.textMuted }]}>
              {isAdmin ? "User" : "Support"}
            </Text>
          </View>

          {/* Call button (admin only) */}
          <View style={styles.headerRight}>
            {isAdmin && (
              <TouchableOpacity
                style={[styles.callButton, { backgroundColor: "#10B98130" }]}
                onPress={handleCallUser}
                activeOpacity={0.7}
              >
                <Text style={styles.callButtonText}>📞</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Chat with keyboard handling */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={currentUser}
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderComposer={renderComposer}
          renderSend={renderSend}
          placeholder="Type a message..."
          alwaysShowSend
          scrollToBottom
          infiniteScroll
          isTyping={sending}
          renderAvatar={null}
          showUserAvatar={false}
          showAvatarForEveryMessage={false}
          bottomOffset={Platform.OS === "ios" ? 34 : 0}
          minInputToolbarHeight={60}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 56,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerInfo: {
    flex: 1,
    alignItems: "center",
  },
  recipientName: {
    fontSize: 17,
    fontWeight: "700",
  },
  chatStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    width: 60,
    alignItems: "flex-end",
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  callButtonText: {
    fontSize: 22,
  },
});
