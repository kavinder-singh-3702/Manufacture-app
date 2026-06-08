import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../hooks/useTheme";
import { RootStackParamList } from "../../navigation/types";
import { useAdminCallLog } from "../../hooks/queries/useAdminCallLog";

type AdminCallLogDetailRoute = RouteProp<RootStackParamList, "AdminCallLogDetail">;

const formatTime = (iso?: string): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (seconds?: number): string => {
  if (!seconds || seconds < 0) return "—";
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${mm}m ${ss.toString().padStart(2, "0")}s`;
};

/**
 * Phase 5 of the ops rebuild — replaces the useless `Alert.alert('Call details', emails)`
 * from the old AdminOpsConsoleScreen with a real navigation screen.
 *
 * Shows caller/callee, start/end times, duration, notes. If the call has a
 * linked conversation, exposes a button that pushes AdminConversationViewer.
 */
export const AdminCallLogDetailScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<AdminCallLogDetailRoute>();
  const insets = useSafeAreaInsets();

  const { id } = route.params;
  const { callLog, isLoading, refetch, error } = useAdminCallLog(id);

  const [pulled, setPulled] = useState(false);
  const handlePull = async () => {
    setPulled(true);
    try {
      await refetch();
    } finally {
      setPulled(false);
    }
  };

  const callNumber = (phone?: string) => {
    if (!phone) return;
    const url = `tel:${phone.replace(/[^\d+]/g, "")}`;
    Linking.canOpenURL(url).then((can) => {
      if (can) Linking.openURL(url).catch(() => undefined);
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Call log
        </Text>
        <View style={[styles.iconButton, { backgroundColor: "transparent", borderColor: "transparent" }]} />
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingHint, { color: colors.textMuted, marginTop: 12 }]}>Loading call log...</Text>
        </View>
      ) : error || !callLog ? (
        <View style={[styles.loadingState, { padding: spacing.lg }]}>
          <Ionicons name="alert-circle-outline" size={28} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text, marginTop: 8 }]}>
            Couldn't load this call log
          </Text>
          <Text style={[styles.loadingHint, { color: colors.textMuted, textAlign: "center", marginTop: 6 }]}>
            {(error as Error)?.message || "Tap retry to try again."}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: radius.md, marginTop: 14 }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.retryButtonText, { color: colors.textOnPrimary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.lg,
            gap: spacing.md,
            paddingBottom: insets.bottom + spacing.xxl,
          }}
          refreshControl={
            <RefreshControl refreshing={pulled} onRefresh={handlePull} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Top summary card */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
            ]}
          >
            <View style={styles.summaryRow}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: colors.primary + "1a" },
                ]}
              >
                <Ionicons name="call" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryTitle, { color: colors.text }]}>
                  {callLog.caller?.displayName || "Unknown"} → {callLog.callee?.displayName || "Unknown"}
                </Text>
                <Text style={[styles.summaryMeta, { color: colors.textMuted }]}>
                  {formatDuration(callLog.durationSeconds)} • {formatTime(callLog.startedAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* Caller card */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Caller</Text>
            <View style={{ marginTop: 8, gap: 6 }}>
              <Text style={[styles.row, { color: colors.text }]} selectable>
                {callLog.caller?.displayName || "—"}
              </Text>
              {callLog.caller?.email ? (
                <Text style={[styles.rowMuted, { color: colors.textMuted }]} selectable>
                  ✉️ {callLog.caller.email}
                </Text>
              ) : null}
              {callLog.caller?.phone ? (
                <TouchableOpacity onPress={() => callNumber(callLog.caller?.phone || undefined)} activeOpacity={0.7}>
                  <Text style={[styles.rowLink, { color: colors.primary }]} selectable>
                    📞 {callLog.caller.phone}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Callee card */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Callee</Text>
            <View style={{ marginTop: 8, gap: 6 }}>
              <Text style={[styles.row, { color: colors.text }]} selectable>
                {callLog.callee?.displayName || "—"}
              </Text>
              {callLog.callee?.email ? (
                <Text style={[styles.rowMuted, { color: colors.textMuted }]} selectable>
                  ✉️ {callLog.callee.email}
                </Text>
              ) : null}
              {callLog.callee?.phone ? (
                <TouchableOpacity onPress={() => callNumber(callLog.callee?.phone || undefined)} activeOpacity={0.7}>
                  <Text style={[styles.rowLink, { color: colors.primary }]} selectable>
                    📞 {callLog.callee.phone}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Times */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Times</Text>
            <View style={{ marginTop: 8, gap: 6 }}>
              <Text style={[styles.row, { color: colors.text }]}>
                Started: {formatTime(callLog.startedAt)}
              </Text>
              {callLog.endedAt ? (
                <Text style={[styles.row, { color: colors.text }]}>
                  Ended: {formatTime(callLog.endedAt)}
                </Text>
              ) : null}
              <Text style={[styles.row, { color: colors.text }]}>
                Duration: {formatDuration(callLog.durationSeconds)}
              </Text>
            </View>
          </View>

          {/* Notes */}
          {callLog.notes ? (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Notes</Text>
              <Text style={[styles.row, { color: colors.text, marginTop: 8 }]} selectable>
                {callLog.notes}
              </Text>
            </View>
          ) : null}

          {/* Linked conversation shortcut */}
          {callLog.conversationId ? (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() =>
                navigation.navigate("AdminConversation", { id: callLog.conversationId as string })
              }
              style={[
                styles.linkedConv,
                { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.md },
              ]}
            >
              <Ionicons name="chatbubbles" size={18} color={colors.textOnPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.linkedConvTitle, { color: colors.textOnPrimary }]}>
                  View related conversation
                </Text>
                {callLog.conversation?.lastMessage ? (
                  <Text style={[styles.linkedConvHint, { color: colors.textOnPrimary + "C0" }]} numberOfLines={1}>
                    {callLog.conversation.lastMessage}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textOnPrimary} />
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
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
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", textAlign: "center", letterSpacing: -0.3 },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingHint: { fontSize: 13, fontWeight: "600" },
  errorTitle: { fontSize: 15, fontWeight: "800" },
  retryButton: { paddingHorizontal: 22, paddingVertical: 12 },
  retryButtonText: { fontSize: 14, fontWeight: "800" },
  card: {},
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  summaryTitle: { fontSize: 15, fontWeight: "800" },
  summaryMeta: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  sectionTitle: { fontSize: 11, fontWeight: "900", letterSpacing: 0.7, textTransform: "uppercase" },
  row: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  rowMuted: { fontSize: 13, fontWeight: "600" },
  rowLink: { fontSize: 14, fontWeight: "800" },
  linkedConv: { flexDirection: "row", alignItems: "center", gap: 12 },
  linkedConvTitle: { fontSize: 14, fontWeight: "800" },
  linkedConvHint: { fontSize: 12, fontWeight: "600", marginTop: 2 },
});
