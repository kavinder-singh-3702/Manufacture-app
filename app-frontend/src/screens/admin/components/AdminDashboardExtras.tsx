import { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../../hooks/useTheme";
import {
  adminService,
  AdminOpsRequest,
  AdminOverview,
  AdminAuditEvent,
} from "../../../services/admin.service";
import {
  PendingApprovalsBar,
  VolumeChart,
  PriorityActionCard,
  RecentActivityFeed,
} from "../../../components/admin";
import { RootStackParamList } from "../../../navigation/types";

export const AdminDashboardExtras = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [priorityRequests, setPriorityRequests] = useState<AdminOpsRequest[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [recentEvents, setRecentEvents] = useState<AdminAuditEvent[]>([]);

  const fetchExtras = useCallback(async () => {
    try {
      const [overviewData, opsData, auditData] = await Promise.all([
        adminService.getOverview(),
        adminService.listOpsRequests({
          sort: "priority:desc",
          limit: 5,
          statusBucket: "open",
        }),
        adminService.listAuditEvents({ limit: 8 }),
      ]);
      setOverview(overviewData);
      setPriorityRequests(opsData.requests);
      setTotalRequests(opsData.pagination.total);
      setRecentEvents(auditData.events);
    } catch (error) {
      console.warn("Failed to fetch dashboard extras:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchExtras();
    }, [fetchExtras])
  );

  const handleReview = useCallback(
    (item: AdminOpsRequest) => {
      navigation.navigate("ServiceRequest", { serviceType: item.serviceType as any, serviceId: item.id });
    },
    [navigation]
  );

  return (
    <View style={styles.container}>
      {/* Pending Approvals */}
      <PendingApprovalsBar overview={overview} />

      {/* Weekly Volume Chart */}
      <View style={styles.section}>
        <VolumeChart />
      </View>

      {/* Priority Actions */}
      {priorityRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PRIORITY ACTIONS</Text>
          {priorityRequests.map((item) => (
            <PriorityActionCard key={item.id} item={item} onReview={handleReview} />
          ))}
          {totalRequests > priorityRequests.length && (
            <TouchableOpacity style={styles.viewAllButton} activeOpacity={0.7}>
              <Text style={[styles.viewAllText, { color: colors.textMuted }]}>
                VIEW ALL ({totalRequests})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Recent Activity Feed */}
      <RecentActivityFeed events={recentEvents} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    paddingBottom: 16,
  },
  section: {
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
  viewAllButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
