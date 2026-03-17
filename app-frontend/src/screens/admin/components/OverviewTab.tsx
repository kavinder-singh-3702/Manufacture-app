import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../../hooks/useTheme";
import {
  adminService,
  AdminOpsRequest,
  AdminStats,
  AdminOverview,
  AdminAuditEvent,
} from "../../../services/admin.service";
import {
  AdminSearchBar,
  AdminFilterTabs,
  PriorityActionCard,
  SystemHealthSection,
  PendingApprovalsBar,
  VolumeChart,
  RecentActivityFeed,
} from "../../../components/admin";
import { RootStackParamList } from "../../../navigation/types";

type FilterKey = "all" | "high_urgency" | "manufacturers" | "approvals";

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "ALL ACTIONS" },
  { key: "high_urgency", label: "HIGH URGENCY" },
  { key: "manufacturers", label: "MANUFACTURERS" },
  { key: "approvals", label: "APPROVALS" },
];

export const OverviewTab = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [requests, setRequests] = useState<AdminOpsRequest[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [recentEvents, setRecentEvents] = useState<AdminAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, overviewData, opsData, auditData] = await Promise.all([
        adminService.getStats(),
        adminService.getOverview(),
        adminService.listOpsRequests({
          sort: "priority:desc",
          limit: 10,
          statusBucket: "open",
        }),
        adminService.listAuditEvents({ limit: 8 }),
      ]);
      setStats(statsData);
      setOverview(overviewData);
      setRequests(opsData.requests);
      setTotalRequests(opsData.pagination.total);
      setRecentEvents(auditData.events);
    } catch (error) {
      console.warn("Failed to fetch overview data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const filteredRequests = requests.filter((req) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches =
        req.title?.toLowerCase().includes(q) ||
        req.company?.displayName?.toLowerCase().includes(q) ||
        req.referenceCode?.toLowerCase().includes(q);
      if (!matches) return false;
    }
    switch (activeFilter) {
      case "high_urgency":
        return req.priority === "critical" || req.priority === "high";
      case "manufacturers":
        return req.kind === "business_setup";
      case "approvals":
        return req.status === "pending" || req.status === "in_review";
      default:
        return true;
    }
  });

  const handleReview = useCallback(
    (item: AdminOpsRequest) => {
      navigation.navigate("ServiceDetail", { serviceType: item.serviceType as any });
    },
    [navigation]
  );

  if (loading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* System Health KPIs */}
      <SystemHealthSection stats={stats} overview={overview} loading={loading} />

      {/* Pending Approvals - red badge cards */}
      <PendingApprovalsBar overview={overview} />

      {/* Weekly Volume Chart */}
      <View style={styles.chartSection}>
        <VolumeChart />
      </View>

      {/* Priority Actions */}
      <View style={styles.actionsSection}>
        <AdminSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search Trade ID, Mfg, or Status"
        />

        <AdminFilterTabs
          tabs={FILTER_TABS}
          activeTab={activeFilter}
          onTabChange={setActiveFilter}
        />

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PRIORITY ACTIONS</Text>

        {filteredRequests.map((item) => (
          <PriorityActionCard key={item.id} item={item} onReview={handleReview} />
        ))}

        {filteredRequests.length === 0 && !loading && (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No priority actions found
          </Text>
        )}

        {totalRequests > requests.length && (
          <TouchableOpacity style={styles.viewAllButton} activeOpacity={0.7}>
            <Text style={[styles.viewAllText, { color: colors.textMuted }]}>
              VIEW ALL PRIORITY TASKS ({totalRequests})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Recent Activity Timeline */}
      <RecentActivityFeed events={recentEvents} />

      {/* Bottom spacing */}
      <View style={{ height: 24 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  chartSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  actionsSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    paddingVertical: 24,
  },
  viewAllButton: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
