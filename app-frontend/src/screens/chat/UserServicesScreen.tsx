import { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert, TextInput, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { chatService } from "../../services/chat.service";
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

  const loadConversation = useCallback(async () => {
    try {
      const response = await chatService.listConversations();
      const first = response.conversations[0] || null;
      setConversation(first);
      setUnreadCount(first?.unreadCount || 0);
    } catch (err) {
      console.error("Error loading conversation:", err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConversation();
    }, [loadConversation])
  );

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversation();
    setRefreshing(false);
  };

  const handleOpenChat = async () => {
    if (!user?.id) {
      Alert.alert("Error", "Please log in to start a chat.");
      return;
    }

    if (!user?.phone) {
      Alert.alert(
        "Phone Number Required",
        "Please add your phone number in your profile before starting a chat.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Go to Profile", onPress: () => navigation.navigate("Profile") }
        ]
      );
      return;
    }

    try {
      setLoading(true);
      const conversationId = conversation?.id || (await chatService.startConversation());
      await loadConversation();
      navigation.navigate("Chat", {
        conversationId,
        recipientId: conversation?.otherParticipant?.id,
        recipientName: conversation?.otherParticipant?.name || "Support",
        recipientPhone: conversation?.otherParticipant?.phone,
      });
    } catch (err) {
      console.error("Error opening chat:", err);
      Alert.alert("Error", "Could not open chat. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleCall = async () => {
    if (!user?.id) {
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
      const conversationId = conversation?.id || (await chatService.startConversation(conversation?.otherParticipant?.id));
      const calleeId = conversation?.otherParticipant?.id;
      if (!calleeId) {
        throw new Error("Support participant not configured.");
      }
      await chatService.logCall({
        conversationId,
        calleeId,
        startedAt: new Date(),
        durationSeconds: 0,
        notes: callReason,
      });
      Alert.alert("Scheduled", "We've logged your call request. Our team will reach out.");
      setCallReason("");
      setShowScheduleForm(false);
    } catch (err) {
      console.error("Error scheduling call:", err);
      Alert.alert("Error", "Could not schedule your call. Please try again.");
    } finally {
      setScheduleLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
    >
      <LinearGradient colors={["rgba(108, 99, 255, 0.06)", "transparent"]} style={StyleSheet.absoluteFill} />

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
        <Text style={[styles.heading, { color: colors.text }]}>Chat with Support</Text>
        <Text style={[styles.subheading, { color: colors.textMuted }]}>
          Get help from our team via chat.
        </Text>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading...</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleOpenChat}
            style={[styles.primaryButton, { backgroundColor: colors.primary, borderRadius: radius.md }]}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>Open Chat</Text>
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: "#fff" }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
        <Text style={[styles.heading, { color: colors.text }]}>Schedule a Call</Text>
        <Text style={[styles.subheading, { color: colors.textMuted }]}>
          Let us know when to call you.
        </Text>

        {showScheduleForm ? (
          <>
            <TextInput
              value={callReason}
              onChangeText={setCallReason}
              placeholder="Describe your request"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  borderRadius: radius.md,
                },
              ]}
              multiline
            />
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  { borderColor: colors.border, borderRadius: radius.md, flex: 1 },
                ]}
                onPress={() => {
                  setCallReason("");
                  setShowScheduleForm(false);
                }}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary, borderRadius: radius.md, flex: 1 },
                ]}
                onPress={handleScheduleCall}
                disabled={scheduleLoading}
              >
                <Text style={styles.primaryButtonText}>{scheduleLoading ? "Logging..." : "Submit"}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { borderColor: colors.primary, borderRadius: radius.md, backgroundColor: colors.primary + "12" },
            ]}
            onPress={() => setShowScheduleForm(true)}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Request a Call</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  card: { padding: 16, borderWidth: 1, marginBottom: 16 },
  heading: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  subheading: { fontSize: 14, fontWeight: "500", marginBottom: 12 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  loadingText: { fontSize: 14, fontWeight: "500" },
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 8 },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  secondaryButton: { alignItems: "center", justifyContent: "center", paddingVertical: 12, borderWidth: 1.5 },
  secondaryButtonText: { fontSize: 15, fontWeight: "700" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: "800" },
  input: { padding: 12, borderWidth: 1, minHeight: 80, textAlignVertical: "top", marginBottom: 12 },
});
