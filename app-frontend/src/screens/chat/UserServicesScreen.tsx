/**
 * UserServicesScreen
 *
 * The "Services" tab for regular users (non-admin).
 * Shows chat with support and schedule a call features.
 *
 * FEATURES:
 * - View existing chat conversation with admin
 * - See unread message count
 * - Schedule a call with admin (sends notification)
 */

import { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert, TextInput, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { firebaseChatService } from "../../services/firebase-chat.service";
import type { RootStackParamList } from "../../navigation/types";
import type { ChatConversation } from "../../types/chat";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const UserServicesScreen = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [callReason, setCallReason] = useState("");
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const { colors, spacing, radius } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  // Get user ID (handle both 'id' and '_id')
  const userId = user?.id || (user as any)?._id;

  /**
   * Load user's existing conversation with admin
   */
  const loadConversation = useCallback(async () => {
    if (!userId) return;

    try {
      const conv = await firebaseChatService.getUserConversation(userId);
      setConversation(conv);
      if (conv) {
        setUnreadCount(conv.unreadCount || 0);
      }
    } catch (err) {
      console.error("Error loading conversation:", err);
    }
  }, [userId]);

  // Load conversation on mount and when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadConversation();
    }, [loadConversation])
  );

  // Subscribe to real-time unread count updates
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = firebaseChatService.subscribeToUserConversation(
      userId,
      (conv) => {
        setConversation(conv);
        setUnreadCount(conv?.unreadCount || 0);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversation();
    setRefreshing(false);
  };

  /**
   * Open chat with admin
   */
  const handleOpenChat = async () => {
    // Check if user is logged in
    if (!userId) {
      Alert.alert("Error", "Please log in to start a chat.");
      return;
    }

    // Check if user has phone number
    if (!user?.phone) {
      Alert.alert(
        "Phone Number Required",
        "Please add your phone number in your profile before starting a chat. This allows our support team to call you if needed.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Go to Profile", onPress: () => navigation.navigate("Profile") }
        ]
      );
      return;
    }

    try {
      setLoading(true);

      const userName = user.displayName || user.firstName || "User";
      const userPhone = user.phone;

      // Get or create conversation
      const conversationId = await firebaseChatService.getOrCreateConversation(
        userId,
        userName,
        userPhone,
        "admin-001"
      );

      // Navigate to chat
      navigation.navigate("Chat", {
        conversationId,
        recipientName: "Support Admin",
      });
    } catch (err) {
      console.error("Error opening chat:", err);
      Alert.alert("Error", "Could not open chat. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Schedule a call - sends request to admin via Firebase
   */
  const handleScheduleCall = async () => {
    if (!userId) {
      Alert.alert("Error", "Please log in to schedule a call.");
      return;
    }

    if (!user?.phone) {
      Alert.alert(
        "Phone Number Required",
        "Please add your phone number in your profile before scheduling a call.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Go to Profile", onPress: () => navigation.navigate("Profile") }
        ]
      );
      return;
    }

    if (!callReason.trim()) {
      Alert.alert("Reason Required", "Please tell us why you'd like us to call you.");
      return;
    }

    try {
      setScheduleLoading(true);

      await firebaseChatService.scheduleCallRequest(
        userId,
        user.displayName || user.firstName || "User",
        user.phone,
        callReason.trim()
      );

      Alert.alert(
        "Call Scheduled! ✅",
        "Our support team has been notified and will call you soon.",
        [{ text: "OK" }]
      );

      setCallReason("");
      setShowScheduleForm(false);
    } catch (err) {
      console.error("Error scheduling call:", err);
      Alert.alert("Error", "Could not schedule call. Please try again.");
    } finally {
      setScheduleLoading(false);
    }
  };

  // Format last message time
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <LinearGradient
        colors={["rgba(108, 99, 255, 0.08)", "transparent"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroIcon}>🛎️</Text>
        <Text style={[styles.heroTitle, { color: colors.text }]}>Services</Text>
        <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
          Get help and support from our team
        </Text>
      </View>

      {/* Chat Card - Shows existing conversation or start new */}
      <TouchableOpacity
        onPress={handleOpenChat}
        disabled={loading}
        activeOpacity={0.8}
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: unreadCount > 0 ? colors.primary : colors.border,
          },
        ]}
      >
        <LinearGradient
          colors={["rgba(108, 99, 255, 0.1)", "transparent"]}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
        />

        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <LinearGradient
              colors={["#6C63FF", "#5248E6"]}
              style={[styles.cardIcon, { borderRadius: radius.md }]}
            >
              <Text style={styles.cardIconText}>💬</Text>
            </LinearGradient>
            {/* Unread badge */}
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.cardTitleContainer}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {conversation ? "Chat with Support" : "Start a Chat"}
            </Text>
            {conversation?.lastMessage ? (
              <Text style={[styles.lastMessage, { color: colors.textMuted }]} numberOfLines={1}>
                {conversation.lastMessage}
              </Text>
            ) : (
              <Text style={[styles.cardDescription, { color: colors.textMuted }]}>
                Get quick help from our team
              </Text>
            )}
            {conversation?.lastMessageTime && (
              <Text style={[styles.timeText, { color: colors.textMuted }]}>
                {formatTime(conversation.lastMessageTime)}
              </Text>
            )}
          </View>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={[styles.arrowContainer, { backgroundColor: colors.primary + "20" }]}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Schedule a Call Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
      >
        <LinearGradient
          colors={["rgba(16, 185, 129, 0.1)", "transparent"]}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
        />

        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <LinearGradient
              colors={["#10B981", "#059669"]}
              style={[styles.cardIcon, { borderRadius: radius.md }]}
            >
              <Text style={styles.cardIconText}>📞</Text>
            </LinearGradient>
          </View>
          <View style={styles.cardTitleContainer}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Schedule a Call
            </Text>
            <Text style={[styles.cardDescription, { color: colors.textMuted }]}>
              Request a callback from our team
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowScheduleForm(!showScheduleForm)}
            style={[styles.arrowContainer, { backgroundColor: "#10B98120" }]}
          >
            <Text style={styles.arrowText}>{showScheduleForm ? "−" : "+"}</Text>
          </TouchableOpacity>
        </View>

        {/* Schedule Call Form */}
        {showScheduleForm && (
          <View style={styles.scheduleForm}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
              Why would you like us to call?
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="e.g., Discuss order, technical issue, etc."
              placeholderTextColor={colors.textMuted}
              value={callReason}
              onChangeText={setCallReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <TouchableOpacity
              onPress={handleScheduleCall}
              disabled={scheduleLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#10B981", "#059669"]}
                style={[styles.scheduleButton, { borderRadius: radius.md }]}
              >
                {scheduleLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.scheduleButtonIcon}>📞</Text>
                    <Text style={styles.scheduleButtonText}>Request Call</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* FAQ Card (Coming Soon) */}
      <View
        style={[
          styles.comingSoonCard,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={styles.comingSoonIcon}>📚</Text>
        <View style={styles.comingSoonContent}>
          <Text style={[styles.comingSoonTitle, { color: colors.text }]}>
            FAQ & Help Center
          </Text>
          <Text style={[styles.comingSoonText, { color: colors.textMuted }]}>
            Find answers to common questions
          </Text>
        </View>
        <View style={[styles.comingSoonBadge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.comingSoonBadgeText, { color: colors.primary }]}>Soon</Text>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  heroSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 32,
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  card: {
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIconContainer: {
    marginRight: 12,
    position: "relative",
  },
  cardIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  cardIconText: {
    fontSize: 24,
  },
  unreadBadge: {
    position: "absolute",
    top: -4,
    right: -4,
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
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  lastMessage: {
    fontSize: 13,
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
    marginTop: 4,
  },
  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6C63FF",
  },
  scheduleForm: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  formLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    marginBottom: 12,
  },
  scheduleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  scheduleButtonIcon: {
    fontSize: 18,
  },
  scheduleButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  comingSoonCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
  },
  comingSoonIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  comingSoonContent: {
    flex: 1,
  },
  comingSoonTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  comingSoonText: {
    fontSize: 12,
    marginTop: 2,
  },
  comingSoonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
