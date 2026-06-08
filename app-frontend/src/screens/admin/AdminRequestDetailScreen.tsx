import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../hooks/useTheme";
import { RootStackParamList } from "../../navigation/types";
import { useAdminRequestDetail } from "../../hooks/queries/useAdminRequestDetail";
import { AdminRequestHeader } from "./components/AdminRequestHeader";
import { AdminRequestContent } from "./components/AdminRequestContent";
import { AdminRequestTimeline } from "./components/AdminRequestTimeline";
import { AdminRequestActions } from "./components/AdminRequestActions";

type DetailRouteProp = RouteProp<RootStackParamList, "AdminRequestDetail">;

/**
 * Admin Ops Request detail — Phase 2 of the ops console rebuild.
 *
 * Replaces the old `<Modal>` inside AdminOpsConsoleScreen. As a real native-stack
 * screen, it:
 *   - Supports the OS back gesture and deep-linking from notifications.
 *   - Renders the Advance action and reason input at SCREEN ROOT, fixing the
 *     audit's CRITICAL "Advance no-op" bug (the old code nested the reason
 *     modal inside an unmounted parent Modal).
 *   - Hits typed React Query hooks for both the read (`useAdminRequestDetail`)
 *     and the workflow PATCH (`useUpdateRequestWorkflow`), so a successful
 *     mutation invalidates both the open detail and the parent RequestsTab
 *     list in one shot.
 *
 * The screen handles three states explicitly: loading, error, and ready.
 * The container uses safe-area insets so the back button doesn't sit under
 * the Dynamic Island and the action bar doesn't sit under the home indicator.
 */
export const AdminRequestDetailScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<DetailRouteProp>();
  const insets = useSafeAreaInsets();

  const { id, kind } = route.params;
  const { detail, isLoading, isFetching, refetch, error } = useAdminRequestDetail(kind, id);

  // RefreshControl tracks its OWN pulled-state, not React Query's `isFetching`.
  // Without this, the spinner appears every time a background refetch fires
  // (e.g. after a workflow PATCH invalidates the cache), even though the user
  // never pulled. Then on slow networks the spinner can appear stuck.
  const [pulled, setPulled] = useState(false);
  const handlePull = useCallback(async () => {
    setPulled(true);
    try {
      await refetch();
    } finally {
      setPulled(false);
    }
  }, [refetch]);

  const handleAdvanced = useCallback(() => {
    // Mutation success → React Query invalidates the detail key, which triggers
    // a background refetch. Nothing extra to do here.
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header bar */}
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
          style={[styles.backButton, { backgroundColor: colors.surfaceElevated, borderRadius: 22, borderColor: colors.border }]}
          activeOpacity={0.7}
          hitSlop={12}
        >
          <Text style={[styles.backIcon, { color: colors.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Request detail
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.refreshButton, { backgroundColor: colors.surfaceElevated, borderRadius: 22, borderColor: colors.border }]}
          activeOpacity={0.7}
          hitSlop={12}
          disabled={isFetching}
        >
          <Ionicons name="refresh" size={18} color={isFetching ? colors.textMuted : colors.text} />
        </TouchableOpacity>
      </View>

      {/* Body */}
      {isLoading ? (
        <View style={[styles.loadingState, { padding: spacing.lg }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingHint, { color: colors.textMuted }]}>Loading request...</Text>
        </View>
      ) : error || !detail ? (
        <View style={[styles.loadingState, { padding: spacing.lg, gap: 12 }]}>
          <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Couldn't load this request
          </Text>
          <Text style={[styles.loadingHint, { color: colors.textMuted, textAlign: "center" }]}>
            {(error as Error)?.message || "The request may have been deleted, or the network call failed."}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: radius.md }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.retryButtonText, { color: colors.textOnPrimary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingBottom: insets.bottom + spacing.xxl,
            gap: spacing.lg,
          }}
          refreshControl={
            <RefreshControl
              refreshing={pulled}
              onRefresh={handlePull}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <AdminRequestHeader detail={detail} />
          <AdminRequestContent detail={detail} />
          <AdminRequestActions detail={detail} onAdvanced={handleAdvanced} />
          <AdminRequestTimeline detail={detail} />
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
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  backIcon: { fontSize: 28, fontWeight: "700", marginLeft: -2 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", textAlign: "center", letterSpacing: -0.3 },
  refreshButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingHint: { fontSize: 13, fontWeight: "600" },
  errorTitle: { fontSize: 16, fontWeight: "800" },
  retryButton: { paddingHorizontal: 22, paddingVertical: 12, marginTop: 4 },
  retryButtonText: { fontSize: 14, fontWeight: "800" },
});
