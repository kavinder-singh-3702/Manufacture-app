import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useToast } from "../../components/ui/Toast";
import { feedbackService, FeedbackItem } from "../../services/feedback.service";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FilterValue = "new" | "resolved" | "all";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "new", label: "New" },
  { value: "resolved", label: "Resolved" },
  { value: "all", label: "All" },
];

const formatDate = (iso?: string) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
};

const submitterName = (user: FeedbackItem["user"]) => {
  if (!user) return "Unknown user";
  if (typeof user === "string") return "User";
  return user.displayName || user.email || "User";
};

const submitterEmail = (user: FeedbackItem["user"]) => {
  if (!user || typeof user === "string") return "";
  return user.email || "";
};

export const FeedbackInboxScreen = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const { success, error } = useToast();

  const [filter, setFilter] = useState<FilterValue>("new");
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Track in-flight PATCH per row so overlapping toggles on different rows
  // don't accidentally re-enable each other's button.
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(() => new Set());

  // Request-generation counter. Every fetch bumps it; the response is only
  // committed if it's still the latest. Prevents a slow previous filter's
  // response from overwriting the current filter's rows.
  const loadGenRef = useRef(0);

  const load = useCallback(
    async (isRefresh = false) => {
      const gen = loadGenRef.current + 1;
      loadGenRef.current = gen;
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setLoadError(null);
        const statusParam = filter === "all" ? undefined : filter;
        const response = await feedbackService.list({ status: statusParam, limit: 100 });
        if (gen !== loadGenRef.current) return; // stale
        setItems(response.feedback || []);
      } catch (err: any) {
        if (gen !== loadGenRef.current) return;
        setLoadError(err?.message || "Could not load feedback.");
      } finally {
        if (gen !== loadGenRef.current) return;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter]
  );

  // Clear the visible rows the moment the filter changes so the admin isn't
  // looking at stale New-filtered rows while the Resolved fetch is in
  // flight. The spinner takes over during that window.
  useEffect(() => {
    setItems([]);
    load();
  }, [load]);

  const toggleResolved = useCallback(
    async (item: FeedbackItem) => {
      // Per-row re-entrancy guard: if this row is already being toggled,
      // ignore the second tap. Prevents duplicate PATCH on rapid double-tap.
      if (resolvingIds.has(item.id)) return;
      const nextResolved = !item.resolvedAt;
      setResolvingIds((prev) => {
        const next = new Set(prev);
        next.add(item.id);
        return next;
      });
      try {
        const updated = await feedbackService.setResolved(item.id, nextResolved);
        // Optimistic-ish update: keep list stable, update the row in place.
        setItems((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
        success(nextResolved ? "Marked resolved" : "Reopened", "");
        // If the row no longer matches the current filter, drop it.
        if (
          (filter === "new" && updated.resolvedAt) ||
          (filter === "resolved" && !updated.resolvedAt)
        ) {
          setItems((prev) => prev.filter((row) => row.id !== updated.id));
        }
      } catch (err: any) {
        error("Update failed", err?.message || "Please try again.");
      } finally {
        setResolvingIds((prev) => {
          if (!prev.has(item.id)) return prev;
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
    },
    [filter, resolvingIds, success, error]
  );

  const counts = useMemo(() => {
    const total = items.length;
    const newCount = items.filter((r) => !r.resolvedAt).length;
    return { total, newCount };
  }, [items]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[colors.surfaceCanvasStart, colors.surfaceCanvasMid, colors.surfaceCanvasEnd]}
          locations={[0, 0.58, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={[styles.headerRow, { paddingTop: 12, paddingHorizontal: spacing.lg }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          style={[
            styles.backButton,
            { borderRadius: radius.md, borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <Ionicons name="arrow-back" size={16} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Feedback</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {counts.newCount} new · {counts.total} shown
          </Text>
        </View>
      </View>

      <View style={[styles.filterRow, { paddingHorizontal: spacing.lg, marginTop: spacing.sm }]}>
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <TouchableOpacity
              key={f.value}
              onPress={() => setFilter(f.value)}
              activeOpacity={0.8}
              style={[
                styles.filterChip,
                {
                  borderRadius: radius.pill,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primary : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: active ? colors.textOnPrimary : colors.text },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.xxl + insets.bottom,
          gap: spacing.sm,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loadError ? (
          <View
            style={[
              styles.errorBanner,
              {
                borderRadius: radius.md,
                borderColor: colors.error + "55",
                backgroundColor: colors.error + "18",
                padding: spacing.md,
              },
            ]}
          >
            <Text style={[styles.errorTitle, { color: colors.error }]}>Couldn't load feedback</Text>
            <Text style={[styles.errorBody, { color: colors.text }]} numberOfLines={2}>
              {loadError}
            </Text>
            <TouchableOpacity
              onPress={() => load()}
              activeOpacity={0.8}
              style={[
                styles.retryButton,
                { borderRadius: radius.pill, backgroundColor: colors.error, marginTop: 8 },
              ]}
            >
              <Text style={[styles.retryButtonText, { color: colors.textOnPrimary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {loading && !items.length ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : items.length === 0 && !loadError ? (
          <View style={styles.centered}>
            <Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted, marginTop: 8 }]}>
              {filter === "new" ? "No new feedback." : filter === "resolved" ? "No resolved feedback yet." : "No feedback yet."}
            </Text>
          </View>
        ) : (
          items.map((item) => {
            const isResolved = !!item.resolvedAt;
            const busy = resolvingIds.has(item.id);
            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  {
                    borderRadius: radius.md,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    padding: spacing.md,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                      {item.subject?.trim() || "(No subject)"}
                    </Text>
                    <Text style={[styles.cardMeta, { color: colors.textMuted }]} numberOfLines={2}>
                      {submitterName(item.user)}
                      {submitterEmail(item.user) ? ` · ${submitterEmail(item.user)}` : ""}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        borderRadius: radius.pill,
                        backgroundColor: isResolved ? colors.success + "22" : colors.warning + "22",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: isResolved ? colors.success : colors.warning },
                      ]}
                    >
                      {isResolved ? "Resolved" : "New"}
                    </Text>
                  </View>
                </View>

                {item.rating ? (
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Ionicons
                        key={n}
                        name={n <= item.rating! ? "star" : "star-outline"}
                        size={14}
                        color={colors.warning}
                      />
                    ))}
                    <Text style={[styles.ratingText, { color: colors.textMuted }]}>
                      {" "}
                      {item.rating}/5
                    </Text>
                  </View>
                ) : null}

                <Text style={[styles.cardBody, { color: colors.text }]}>{item.message}</Text>

                <View style={styles.cardFooter}>
                  <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                    {formatDate(item.createdAt)}
                    {item.platform ? ` · ${item.platform}` : ""}
                    {item.appVersion ? ` · v${item.appVersion}` : ""}
                  </Text>
                  <TouchableOpacity
                    onPress={() => toggleResolved(item)}
                    disabled={busy}
                    activeOpacity={0.8}
                    style={[
                      styles.resolveButton,
                      {
                        borderRadius: radius.pill,
                        borderColor: isResolved ? colors.border : colors.primary,
                        backgroundColor: isResolved ? colors.surface : colors.primary,
                        opacity: busy ? 0.6 : 1,
                      },
                    ]}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color={isResolved ? colors.text : colors.textOnPrimary} />
                    ) : (
                      <Text
                        style={[
                          styles.resolveButtonText,
                          { color: isResolved ? colors.text : colors.textOnPrimary },
                        ]}
                      >
                        {isResolved ? "Reopen" : "Mark resolved"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  backButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  headerSubtitle: { fontSize: 13, fontWeight: "500", marginTop: 2 },
  filterRow: { flexDirection: "row", gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1 },
  filterChipText: { fontSize: 13, fontWeight: "700" },
  centered: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, fontWeight: "500" },
  card: { borderWidth: 1, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardMeta: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3 },
  statusPillText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" },
  starsRow: { flexDirection: "row", alignItems: "center" },
  ratingText: { fontSize: 12, fontWeight: "500" },
  cardBody: { fontSize: 14, lineHeight: 20 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  resolveButton: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  resolveButtonText: { fontSize: 12, fontWeight: "700" },
  errorBanner: { borderWidth: 1 },
  errorTitle: { fontSize: 13, fontWeight: "800", marginBottom: 4 },
  errorBody: { fontSize: 13, fontWeight: "500" },
  retryButton: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 6 },
  retryButtonText: { fontSize: 12, fontWeight: "700" },
});
