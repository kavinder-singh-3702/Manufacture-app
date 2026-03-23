import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../../hooks/useTheme";
import { useThemeMode } from "../../../hooks/useThemeMode";
import { adminService, AdminOpsRequest, AdminOverview } from "../../../services/admin.service";
import { PriorityActionCard } from "../../../components/admin";

/* ── Neumorphic helpers ── */
const NEU_LIGHT = "#EDF1F7";
const NEU_DARK = "#1A1F2B";
const NEU_INSET_LIGHT = "#E2E8F0";
const NEU_INSET_DARK = "#151A24";

const neuRaised = (isDark: boolean) =>
  isDark
    ? { shadowColor: "#000", shadowOffset: { width: 2, height: 3 }, shadowOpacity: 0.45, shadowRadius: 6, elevation: 4 }
    : { shadowColor: "#A3B1C6", shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 };

const neuPressed = (isDark: boolean) =>
  isDark
    ? { shadowColor: "#000", shadowOffset: { width: 1, height: 1 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 1 }
    : { shadowColor: "#A3B1C6", shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 1 };

const neuCardBg = (isDark: boolean) => (isDark ? NEU_DARK : NEU_LIGHT);
const neuInsetBg = (isDark: boolean) => (isDark ? NEU_INSET_DARK : NEU_INSET_LIGHT);

export const AlertsTab = () => {
  const { colors, radius } = useTheme();
  const { resolvedMode } = useThemeMode();
  const isDark = resolvedMode === "dark";

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [criticalRequests, setCriticalRequests] = useState<AdminOpsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const [overviewData, criticalData] = await Promise.all([
        adminService.getOverview(),
        adminService.listOpsRequests({
          priority: "critical",
          statusBucket: "open",
          sort: "updatedAt:desc",
          limit: 20,
        }),
      ]);
      setOverview(overviewData);
      setCriticalRequests(criticalData.requests);
    } catch (error) {
      console.warn("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAlerts();
    }, [fetchAlerts])
  );

  if (loading && !overview) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const pendingVerifications = overview?.stats?.verifications?.pending ?? 0;
  const overdueRequests = overview?.servicesQueue?.overdue ?? 0;
  const agingGt72h = overview?.verificationAging?.gt72h ?? 0;
  const failedNotifications = overview?.notificationDispatchHealth?.failed ?? 0;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchAlerts(true)}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.summaryGrid}>
        {overdueRequests > 0 && (
          <View style={[styles.alertCard, { backgroundColor: neuCardBg(isDark), borderRadius: radius.lg, ...neuPressed(isDark) }]}>
            <Text style={[styles.alertValue, { color: colors.error }]}>{overdueRequests}</Text>
            <Text style={[styles.alertLabel, { color: colors.error }]}>Overdue Requests</Text>
          </View>
        )}
        {pendingVerifications > 0 && (
          <View style={[styles.alertCard, { backgroundColor: neuCardBg(isDark), borderRadius: radius.lg, ...neuPressed(isDark) }]}>
            <Text style={[styles.alertValue, { color: colors.warning }]}>{pendingVerifications}</Text>
            <Text style={[styles.alertLabel, { color: colors.warning }]}>Pending Verifications</Text>
          </View>
        )}
        {agingGt72h > 0 && (
          <View style={[styles.alertCard, { backgroundColor: neuCardBg(isDark), borderRadius: radius.lg, ...neuPressed(isDark) }]}>
            <Text style={[styles.alertValue, { color: colors.error }]}>{agingGt72h}</Text>
            <Text style={[styles.alertLabel, { color: colors.error }]}>Aging &gt; 72h</Text>
          </View>
        )}
        {failedNotifications > 0 && (
          <View style={[styles.alertCard, { backgroundColor: neuCardBg(isDark), borderRadius: radius.lg, ...neuPressed(isDark) }]}>
            <Text style={[styles.alertValue, { color: colors.warning }]}>{failedNotifications}</Text>
            <Text style={[styles.alertLabel, { color: colors.warning }]}>Failed Notifications</Text>
          </View>
        )}
      </View>

      {(overdueRequests === 0 && pendingVerifications === 0 && agingGt72h === 0 && failedNotifications === 0) && (
        <View style={[styles.allClearContainer, { backgroundColor: neuCardBg(isDark), borderRadius: 16, ...neuRaised(isDark) }]}>
          <Text style={[styles.allClearText, { color: colors.success }]}>All Clear</Text>
          <Text style={[styles.allClearSubtext, { color: colors.textMuted }]}>No critical alerts at this time</Text>
        </View>
      )}

      {criticalRequests.length > 0 && (
        <View style={[styles.criticalSection, { backgroundColor: neuCardBg(isDark), borderRadius: 16, padding: 16, ...neuRaised(isDark) }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>CRITICAL REQUESTS</Text>
          {criticalRequests.map((item) => (
            <PriorityActionCard key={item.id} item={item} />
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  alertCard: {
    width: "48%",
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  alertValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  alertLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  allClearContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 6,
    marginBottom: 16,
  },
  allClearText: {
    fontSize: 20,
    fontWeight: "700",
  },
  allClearSubtext: {
    fontSize: 14,
  },
  criticalSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
});
