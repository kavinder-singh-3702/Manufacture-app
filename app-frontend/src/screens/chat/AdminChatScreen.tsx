/**
 * AdminChatScreen
 *
 * The chat management screen for admins.
 * Shows a list of all conversations with users (from Firebase).
 *
 * FEATURES:
 * - Real-time list of conversations from Firebase
 * - Call button next to each user (opens phone app)
 * - Chat button to open conversation
 * - Unread message badges
 * - Call request notifications from users
 */

import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Linking, Alert, Platform, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { firebaseChatService } from "../../services/firebase-chat.service";
import type { ChatConversation } from "../../types/chat";
import type { RootStackParamList } from "../../navigation/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type CallRequest = {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  reason: string;
  status: string;
  createdAt: string;
};

export const AdminChatScreen = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [callRequests, setCallRequests] = useState<CallRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  // Subscribe to real-time conversations from Firebase
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Real-time listener for conversations
    const unsubscribeConversations = firebaseChatService.subscribeToConversations((convs) => {
      setConversations(convs);
      setLoading(false);
    });

    // Real-time listener for call requests
    const unsubscribeCallRequests = firebaseChatService.subscribeToCallRequests((requests) => {
      setCallRequests(requests as CallRequest[]);
    });

    // Cleanup on unmount
    return () => {
      unsubscribeConversations();
      unsubscribeCallRequests();
    };
  }, []);

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  /**
   * Handle tapping on chat button - Opens the chat screen
   */
  const handleOpenChat = (conversation: ChatConversation) => {
    navigation.navigate("Chat", {
      conversationId: conversation.id,
      recipientName: conversation.userName,
      recipientPhone: conversation.userPhone,
    });
  };

  /**
   * Handle calling a user - Opens phone app directly
   */
  const handleCallUser = async (phone: string, name: string) => {
    if (!phone) {
      Alert.alert("No Phone Number", `${name} hasn't provided a phone number.`);
      return;
    }

    const cleanedNumber = phone.replace(/[^\d+]/g, "");
    const phoneUrl = Platform.OS === "android" ? `tel:${cleanedNumber}` : `telprompt:${cleanedNumber}`;

    try {
      const supported = await Linking.canOpenURL(phoneUrl);
      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert(`Call ${name}`, `Phone: ${phone}`, [{ text: "OK" }]);
      }
    } catch (err) {
      console.error("Error opening phone:", err);
      Alert.alert("Error", "Could not open phone app.");
    }
  };

  /**
   * Handle completing a call request
   */
  const handleCompleteCallRequest = async (request: CallRequest) => {
    Alert.alert(
      "Complete Call Request",
      `Mark call request from ${request.userName} as completed?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call & Complete",
          onPress: async () => {
            await handleCallUser(request.userPhone, request.userName);
            await firebaseChatService.completeCallRequest(request.id);
          },
        },
        {
          text: "Mark Complete",
          onPress: async () => {
            await firebaseChatService.completeCallRequest(request.id);
          },
        },
      ]
    );
  };

  // Calculate totals
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  const totalCallRequests = callRequests.length;

  // Get initials from name
  const getInitials = (name: string): string => {
    const words = name.trim().split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Format time
  const formatTime = (timestamp: string | undefined): string => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Render call request card
  const renderCallRequest = ({ item }: { item: CallRequest }) => (
    <TouchableOpacity
      onPress={() => handleCompleteCallRequest(item)}
      activeOpacity={0.8}
      style={[
        styles.callRequestCard,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: 2,
          borderColor: "#10B981",
        },
      ]}
    >
      <LinearGradient
        colors={["rgba(16, 185, 129, 0.15)", "transparent"]}
        style={[StyleSheet.absoluteFill, { borderRadius: radius.md }]}
      />

      <View style={styles.callRequestIcon}>
        <Text style={styles.callRequestIconText}>📞</Text>
      </View>

      <View style={styles.callRequestInfo}>
        <Text style={[styles.callRequestName, { color: colors.text }]}>
          {item.userName}
        </Text>
        <Text style={[styles.callRequestPhone, { color: "#10B981" }]}>
          {item.userPhone}
        </Text>
        <Text style={[styles.callRequestReason, { color: colors.textMuted }]} numberOfLines={2}>
          "{item.reason}"
        </Text>
        <Text style={[styles.callRequestTime, { color: colors.textMuted }]}>
          {formatTime(item.createdAt)}
        </Text>
      </View>

      <View style={[styles.callNowButton, { backgroundColor: "#10B981" }]}>
        <Text style={styles.callNowText}>Call</Text>
      </View>
    </TouchableOpacity>
  );

  // Render conversation item
  const renderConversation = useCallback(
    ({ item }: { item: ChatConversation }) => (
      <View
        style={[
          styles.userCard,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
      >
        <LinearGradient
          colors={item.unreadCount > 0 ? ["#6C63FF", "#5248E6"] : ["#3A3D4A", "#2E3138"]}
          style={[styles.avatar, { borderRadius: radius.lg }]}
        >
          <Text style={styles.avatarText}>{getInitials(item.userName)}</Text>
        </LinearGradient>

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
              {item.userName}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {item.unreadCount > 9 ? "9+" : item.unreadCount}
                </Text>
              </View>
            )}
          </View>

          {item.lastMessage && (
            <Text style={[styles.lastMessage, { color: colors.textMuted }]} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          )}

          <View style={styles.metaRow}>
            {item.lastMessageTime && (
              <Text style={[styles.timeText, { color: colors.textMuted }]}>
                {formatTime(item.lastMessageTime)}
              </Text>
            )}
          </View>

          {item.userPhone && (
            <Text style={[styles.phoneNumber, { color: colors.textMuted }]} numberOfLines={1}>
              📱 {item.userPhone}
            </Text>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() => handleCallUser(item.userPhone || "", item.userName)}
            style={[styles.callButton, { backgroundColor: "#10B98130" }]}
            activeOpacity={0.7}
          >
            <Text style={styles.callButtonIcon}>📞</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleOpenChat(item)} activeOpacity={0.8}>
            <LinearGradient
              colors={["#6C63FF", "#5248E6"]}
              style={[styles.chatButton, { borderRadius: radius.sm }]}
            >
              <Text style={styles.chatButtonText}>💬 Chat</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [colors, radius]
  );

  // Render loading state
  if (loading && conversations.length === 0) {
    return (
      <LinearGradient colors={["#0F1115", "#101318", "#0F1115"]} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0F1115", "#101318", "#0F1115"]} style={styles.container}>
      <LinearGradient
        colors={["rgba(139, 92, 246, 0.08)", "transparent"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Chat and call your users
            </Text>
          </View>

          {totalUnread > 0 && (
            <LinearGradient colors={["#FF4757", "#FF6348"]} style={styles.headerUnreadBadge}>
              <Text style={styles.headerUnreadText}>{totalUnread} unread</Text>
            </LinearGradient>
          )}
        </View>

        {/* Call Requests Section */}
        {totalCallRequests > 0 && (
          <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                📞 Call Requests
              </Text>
              <View style={styles.callRequestBadge}>
                <Text style={styles.callRequestBadgeText}>{totalCallRequests}</Text>
              </View>
            </View>

            {callRequests.map((request) => (
              <View key={request.id}>
                {renderCallRequest({ item: request })}
              </View>
            ))}
          </View>
        )}

        {/* Conversations Section */}
        <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
          {totalCallRequests > 0 && (
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
              💬 Conversations
            </Text>
          )}

          {conversations.length === 0 && !error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No conversations yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                When users start chatting, they'll appear here
              </Text>
            </View>
          ) : (
            conversations.map((conv) => (
              <View key={conv.id}>{renderConversation({ item: conv })}</View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  headerUnreadBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  headerUnreadText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  callRequestBadge: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  callRequestBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  callRequestCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 10,
  },
  callRequestIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#10B98130",
    alignItems: "center",
    justifyContent: "center",
  },
  callRequestIconText: {
    fontSize: 22,
  },
  callRequestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  callRequestName: {
    fontSize: 16,
    fontWeight: "700",
  },
  callRequestPhone: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
  callRequestReason: {
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 4,
  },
  callRequestTime: {
    fontSize: 11,
    marginTop: 4,
  },
  callNowButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  callNowText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
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
    marginLeft: 12,
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
  unreadBadge: {
    backgroundColor: "#FF4757",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  lastMessage: {
    fontSize: 13,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },
  timeText: {
    fontSize: 11,
  },
  phoneNumber: {
    fontSize: 11,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  callButtonIcon: {
    fontSize: 20,
  },
  chatButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chatButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
