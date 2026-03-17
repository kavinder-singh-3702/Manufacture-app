import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { preferenceService, PreferenceSummary } from "../../services/preference.service";
import { RootStackParamList } from "../../navigation/types";

type RouteProps = RouteProp<RootStackParamList, "UserPreferences">;

const metricLabel = (label: string, value?: number) => `${label}: ${value ?? 0}`;

export const UserPreferenceScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProps>();
  const { userId, displayName } = route.params;

  const [summary, setSummary] = useState<PreferenceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await preferenceService.getUserSummary(userId, { days: 60, limit: 5 });
      setSummary(data);
    } catch (err: any) {
      setError(err.message || "Failed to load preferences");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const actionCounts = useMemo(() => summary?.actionCounts ?? {}, [summary?.actionCounts]);

  const formatDate = (value?: string) => {
    if (!value) return "";
    const d = new Date(value);
    return d.toLocaleString();
  };

  const renderTopList = (
    title: string,
    items: Array<{ label: string; count: number; extra?: string | number }>,
    emptyLabel: string
  ) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {items.length === 0 ? (
        <Text style={[styles.emptyLabel, { color: colors.textSecondary }]}>{emptyLabel}</Text>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {items.map((item) => (
            <View key={item.label} style={[styles.row, { justifyContent: "space-between" }]}>
              <Text style={[styles.rowLabel, { color: colors.text }]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
                {item.label}
              </Text>
              <Text style={[styles.rowValue, { color: colors.primary }]}>
                {item.count}
                {item.extra !== undefined ? ` • ${item.extra}` : ""}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={[styles.centered, { padding: spacing.lg }]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ marginTop: spacing.sm, color: colors.textMuted, fontWeight: "600" }}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={[styles.centered, { padding: spacing.lg }]}>
          <Text style={{ color: colors.error, fontWeight: "700", marginBottom: spacing.sm }}>{error}</Text>
          <TouchableOpacity onPress={fetchSummary} style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: radius.md }]}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <LinearGradient colors={["rgba(99, 102, 241, 0.12)", "transparent"]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
        <View style={[styles.header, { marginBottom: spacing.md }]}> 
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>User Preferences</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}> 
            {displayName || "User"} • Last {summary?.windowDays ?? 60} days
          </Text>
        </View>

        <View style={[styles.heroCard, { borderRadius: radius.lg, overflow: "hidden" }]}> 
          <LinearGradient colors={["#19B8E6", "#148DB2"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: spacing.lg }}>
            <Text style={styles.heroTitle}>{displayName || "User"}</Text>
            <Text style={styles.heroSubtitle}>High-level intent signals</Text>
            <View style={[styles.metricRow, { marginTop: spacing.md }]}> 
              <View style={styles.metricPill}>
                <Text style={styles.metricLabel}>{metricLabel("Searches", actionCounts.search)}</Text>
              </View>
              <View style={styles.metricPill}>
                <Text style={styles.metricLabel}>{metricLabel("Category views", actionCounts.view_category)}</Text>
              </View>
              <View style={styles.metricPill}>
                <Text style={styles.metricLabel}>{metricLabel("Product views", actionCounts.view_product)}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={{ gap: spacing.md, marginTop: spacing.md }}>
          {renderTopList(
            "Top categories",
            (summary?.topCategories || []).map((item) => ({ label: item.category, count: item.count })),
            "No category signals"
          )}

          {renderTopList(
            "Top searches",
            (summary?.topSearchTerms || []).map((item) => ({ label: item.term, count: item.count })),
            "No search signals"
          )}

          {renderTopList(
            "Top products",
            (summary?.topProducts || []).map((item) => ({
              label: item.name || item.id || "Unknown product",
              count: item.total || 0,
              extra: `views ${item.views || 0}`,
            })),
            "No product signals"
          )}

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md }]}> 
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Recent activity</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Latest 25 events</Text>
            </View>
            {summary?.recentEvents?.length ? (
              <View style={{ gap: spacing.sm }}>
                {summary.recentEvents.map((event) => (
                  <View key={event.id} style={[styles.row, { justifyContent: "space-between" }]}> 
                    <View>
                      <Text style={[styles.rowLabel, { color: colors.text }]}>
                        {event.type.replace(/_/g, " ")}
                      </Text>
                      {event.searchTerm && (
                        <Text style={[styles.meta, { color: colors.textMuted }]}>Search: {event.searchTerm}</Text>
                      )}
                      {event.product?.name && (
                        <Text style={[styles.meta, { color: colors.textMuted }]}>Product: {event.product.name}</Text>
                      )}
                      {event.category && !event.product?.name && (
                        <Text style={[styles.meta, { color: colors.textMuted }]}>Category: {event.category}</Text>
                      )}
                    </View>
                    <Text style={[styles.meta, { color: colors.textSecondary, textAlign: "right" }]}> 
                      {formatDate(event.createdAt)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.emptyLabel, { color: colors.textSecondary }]}>No recent events</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { gap: 4 },
  title: { fontSize: 24, fontWeight: "800" },
  subtitle: { fontSize: 14, fontWeight: "600" },
  backText: { fontSize: 14, fontWeight: "700" },
  heroCard: { shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  heroTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  heroSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600", marginTop: 2 },
  metricRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  metricPill: { backgroundColor: "rgba(255,255,255,0.18)", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  metricLabel: { color: "#fff", fontWeight: "700", fontSize: 12 },
  card: { borderWidth: 1 },
  cardHeader: { marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardSubtitle: { fontSize: 12, fontWeight: "600" },
  emptyLabel: { fontSize: 13, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  rowLabel: { fontSize: 14, fontWeight: "600", flexShrink: 1 },
  rowValue: { fontSize: 14, fontWeight: "700" },
  meta: { fontSize: 11, fontWeight: "600" },
  retryButton: { paddingHorizontal: 16, paddingVertical: 10 },
});
