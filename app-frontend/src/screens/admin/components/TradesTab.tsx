import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../../hooks/useTheme";
import {
  adminService,
  AdminOpsRequest,
} from "../../../services/admin.service";
import {
  AdminSearchBar,
  AdminFilterTabs,
  AdminListCard,
} from "../../../components/admin";

type KindFilter = "all" | "service" | "business_setup";
type StatusBucket = "all" | "open" | "closed" | "rejected";

const KIND_TABS: { key: KindFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "service", label: "Services" },
  { key: "business_setup", label: "Startup" },
];

const STATUS_TABS: { key: StatusBucket; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "closed", label: "Closed" },
  { key: "rejected", label: "Rejected" },
];

const PAGE_SIZE = 25;

const getRequestTone = (status?: string) => {
  if (!status) return "neutral" as const;
  if (["completed", "launched", "closed"].includes(status)) return "success" as const;
  if (["cancelled", "rejected"].includes(status)) return "error" as const;
  return "warning" as const;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const TradesTab = () => {
  const { colors } = useTheme();

  const [requests, setRequests] = useState<AdminOpsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [statusBucket, setStatusBucket] = useState<StatusBucket>("all");

  const fetchRequests = useCallback(
    async (offset = 0, isRefresh = false) => {
      try {
        if (offset === 0) isRefresh ? setRefreshing(true) : setLoading(true);
        const { requests: data, pagination } = await adminService.listOpsRequests({
          limit: PAGE_SIZE,
          offset,
          search: searchQuery || undefined,
          kind: kindFilter === "all" ? undefined : kindFilter,
          statusBucket: statusBucket === "all" ? undefined : statusBucket,
          sort: "updatedAt:desc",
        });
        if (offset === 0) {
          setRequests(data);
        } else {
          setRequests((prev) => [...prev, ...data]);
        }
        setHasMore(pagination.hasMore);
      } catch (error) {
        console.warn("Failed to fetch trades:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery, kindFilter, statusBucket]
  );

  useFocusEffect(
    useCallback(() => {
      fetchRequests(0);
    }, [fetchRequests])
  );

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchRequests(requests.length);
    }
  };

  const renderItem = ({ item }: { item: AdminOpsRequest }) => (
    <AdminListCard
      title={item.company?.displayName ?? item.title}
      subtitle={item.title}
      status={{ label: item.status?.replace(/_/g, " ") ?? "-", type: getRequestTone(item.status) }}
      meta={formatDate(item.updatedAt)}
      avatarText={item.company?.displayName?.[0] ?? "?"}
    />
  );

  const combinedTabs = [
    ...KIND_TABS,
    ...STATUS_TABS.filter((t) => t.key !== "all"),
  ];

  const activeComboKey = kindFilter !== "all" ? kindFilter : statusBucket !== "all" ? statusBucket : "all";

  const handleComboChange = (key: string) => {
    const isKind = ["all", "service", "business_setup"].includes(key);
    const isStatus = ["open", "closed", "rejected"].includes(key);
    if (isKind) {
      setKindFilter(key as KindFilter);
      setStatusBucket("all");
    } else if (isStatus) {
      setStatusBucket(key as StatusBucket);
      setKindFilter("all");
    }
  };

  const ListHeader = (
    <View style={styles.listHeader}>
      <AdminSearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search trades..."
      />
      <AdminFilterTabs tabs={combinedTabs} activeTab={activeComboKey} onTabChange={handleComboChange} />
    </View>
  );

  if (loading && requests.length === 0) {
    return (
      <View style={styles.centered}>
        {ListHeader}
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No trades found</Text>
      }
      ListFooterComponent={
        hasMore ? <ActivityIndicator color={colors.primary} style={{ paddingVertical: 16 }} /> : null
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.3}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchRequests(0, true)}
          tintColor={colors.primary}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    paddingVertical: 40,
  },
});
