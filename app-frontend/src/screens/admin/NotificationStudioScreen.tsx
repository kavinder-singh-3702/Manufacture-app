import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { RootStackParamList } from "../../navigation/types";
import {
  notificationService,
  Notification,
  NotificationPriority,
} from "../../services/notification.service";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const defaultComposer = {
  title: "",
  body: "",
  eventKey: "system.admin.broadcast",
  topic: "system",
  priority: "normal" as NotificationPriority,
  userIds: "",
  scheduledAt: "",
};

const priorityOptions: NotificationPriority[] = ["low", "normal", "high", "critical"];

export const NotificationStudioScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const styles = useMemo(() => createStyles(colors, spacing, radius), [colors, spacing, radius]);
  const navigation = useNavigation<Nav>();

  const [composer, setComposer] = useState(defaultComposer);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Notification[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await notificationService.listAdminNotifications({ limit: 40, offset: 0 });
      setItems(response.notifications || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load dispatch history");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dispatchNow = useCallback(async () => {
    if (!composer.title.trim() || !composer.body.trim() || !composer.eventKey.trim()) {
      setError("Title, message, and event key are required.");
      return;
    }

    const userIds = composer.userIds
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (!userIds.length) {
      setError("Add at least one target user ID.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await notificationService.dispatch({
        audience: "user",
        userIds,
        title: composer.title.trim(),
        body: composer.body.trim(),
        eventKey: composer.eventKey.trim(),
        topic: composer.topic.trim() || "system",
        priority: composer.priority,
        channels: composer.priority === "low" || composer.priority === "normal" ? ["in_app"] : ["in_app", "push"],
        scheduledAt: composer.scheduledAt.trim() || undefined,
      });
      setComposer(defaultComposer);
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to dispatch notification");
    } finally {
      setSubmitting(false);
    }
  }, [composer, load]);

  const cancelNotification = useCallback(
    async (id: string) => {
      try {
        await notificationService.cancelAdminNotification(id);
        await load();
      } catch (err: any) {
        setError(err?.message || "Failed to cancel notification");
      }
    },
    [load]
  );

  const resendNotification = useCallback(
    async (id: string) => {
      try {
        await notificationService.resendAdminNotification(id);
        await load();
      } catch (err: any) {
        setError(err?.message || "Failed to resend notification");
      }
    },
    [load]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Notification Studio</Text>
          <Text style={styles.subtitle}>Compose, dispatch, and monitor delivery history</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Compose Notification</Text>

          <TextInput
            style={styles.input}
            placeholder="Title"
            placeholderTextColor={colors.textMuted}
            value={composer.title}
            onChangeText={(value) => setComposer((prev) => ({ ...prev, title: value }))}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Message"
            placeholderTextColor={colors.textMuted}
            value={composer.body}
            onChangeText={(value) => setComposer((prev) => ({ ...prev, body: value }))}
            multiline
            textAlignVertical="top"
          />

          <TextInput
            style={styles.input}
            placeholder="Event key (e.g. campaign.flash_offer)"
            placeholderTextColor={colors.textMuted}
            value={composer.eventKey}
            onChangeText={(value) => setComposer((prev) => ({ ...prev, eventKey: value }))}
          />

          <TextInput
            style={styles.input}
            placeholder="Topic"
            placeholderTextColor={colors.textMuted}
            value={composer.topic}
            onChangeText={(value) => setComposer((prev) => ({ ...prev, topic: value }))}
          />

          <View style={styles.priorityRow}>
            {priorityOptions.map((priority) => {
              const active = composer.priority === priority;
              return (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityChip,
                    {
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primary + "1A" : colors.surfaceElevated,
                    },
                  ]}
                  onPress={() => setComposer((prev) => ({ ...prev, priority }))}
                >
                  <Text style={[styles.priorityChipText, { color: active ? colors.primary : colors.textMuted }]}>{priority}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Target user IDs (comma separated)"
            placeholderTextColor={colors.textMuted}
            value={composer.userIds}
            onChangeText={(value) => setComposer((prev) => ({ ...prev, userIds: value }))}
          />

          <TextInput
            style={styles.input}
            placeholder="Schedule (optional, ISO date-time)"
            placeholderTextColor={colors.textMuted}
            value={composer.scheduledAt}
            onChangeText={(value) => setComposer((prev) => ({ ...prev, scheduledAt: value }))}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.submitBtn} onPress={dispatchNow} disabled={submitting}>
            <Text style={styles.submitBtnText}>{submitting ? "Dispatching..." : "Dispatch"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dispatch History</Text>

          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No dispatched notifications yet.</Text>
            </View>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <Text style={styles.historyTitle}>{item.title}</Text>
                <Text style={styles.historyBody} numberOfLines={2}>
                  {item.body}
                </Text>
                <Text style={styles.historyMeta}>
                  {item.priority.toUpperCase()} • {item.topic || "system"}
                </Text>
                <Text style={styles.historyMeta}>
                  Status: {(item.lifecycleStatus || "queued").replace("-", " ")}
                </Text>
                <Text style={styles.historyMeta}>{new Date(item.createdAt).toLocaleString("en-IN")}</Text>
                <View style={styles.historyActions}>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => resendNotification(item.id)}>
                    <Text style={styles.smallBtnText}>Resend</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => cancelNotification(item.id)}>
                    <Text style={styles.smallBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (
  colors: ReturnType<typeof useTheme>["colors"],
  spacing: ReturnType<typeof useTheme>["spacing"],
  radius: ReturnType<typeof useTheme>["radius"]
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { color: colors.text, fontSize: 17, fontWeight: "900" },
    subtitle: { color: colors.textMuted, fontSize: 12, fontWeight: "600", marginTop: 2 },
    card: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.sm,
    },
    cardTitle: { color: colors.text, fontSize: 14, fontWeight: "900" },
    input: {
      minHeight: 44,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceElevated,
      color: colors.text,
      paddingHorizontal: 12,
      fontSize: 13,
      fontWeight: "600",
    },
    textArea: {
      minHeight: 96,
      paddingTop: 10,
      paddingBottom: 10,
    },
    priorityRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    priorityChip: {
      minHeight: 34,
      borderWidth: 1,
      borderRadius: radius.pill,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    priorityChipText: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
    errorText: { color: colors.error, fontSize: 12, fontWeight: "700" },
    submitBtn: {
      minHeight: 44,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 14,
    },
    submitBtnText: { color: colors.textOnPrimary, fontSize: 13, fontWeight: "900" },
    loadingState: { paddingVertical: spacing.md, alignItems: "center" },
    emptyState: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceElevated,
      padding: spacing.md,
      alignItems: "center",
    },
    emptyStateText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
    historyCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceElevated,
      padding: spacing.sm,
      gap: 4,
    },
    historyTitle: { color: colors.text, fontSize: 13, fontWeight: "800" },
    historyBody: { color: colors.textSecondary, fontSize: 12, fontWeight: "600", lineHeight: 16 },
    historyMeta: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
    historyActions: { flexDirection: "row", gap: 8, marginTop: 4 },
    smallBtn: {
      minHeight: 30,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      paddingHorizontal: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    smallBtnText: { color: colors.text, fontSize: 11, fontWeight: "700" },
  });

export default NotificationStudioScreen;
