import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../hooks/useTheme";
import { useThemeMode } from "../../../hooks/useThemeMode";
import { AdminOpsRequest } from "../../../services/admin.service";
import {
  AdminSearchBar,
  AdminListCard,
  RequestsFilterSheet,
} from "../../../components/admin";
import { neuCardBg } from "../../../theme/neumorphic";
import { RootStackParamList } from "../../../navigation/types";
import {
  REQUESTS_PAGE_SIZE,
  useAdminRequestsList,
} from "../../../hooks/queries/useAdminRequestsList";
import {
  countActiveFilters,
  DEFAULT_REQUESTS_FILTERS,
  KIND_LABELS as KIND_FILTER_LABELS,
  PRIORITY_LABELS,
  RequestsFilters,
  SORT_LABELS,
  STATUS_BUCKET_LABELS,
} from "../../../types/requestsFilters";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_review: "In Review",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
  closed: "Closed",
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  launched: "Launched",
};

const toStatusLabel = (status?: string): string => {
  if (!status) return "—";
  return STATUS_LABELS[status] || status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const KIND_LABELS: Record<AdminOpsRequest["kind"], string> = {
  service: "Service",
  business_setup: "Startup",
};

type StatusType = "success" | "warning" | "error" | "neutral";

const statusType = (status?: string): StatusType => {
  if (!status) return "neutral";
  if (["completed", "approved", "launched"].includes(status)) return "success";
  if (["cancelled", "rejected", "closed"].includes(status)) return "error";
  if (["pending", "in_review", "scheduled", "submitted", "draft"].includes(status)) return "warning";
  return "neutral";
};

const formatRelativeAge = (iso: string): string => {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

export const RequestsTab = () => {
  const { colors, spacing, radius } = useTheme();
  const { resolvedMode } = useThemeMode();
  const isDark = resolvedMode === "dark";
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [searchInput, setSearchInput] = useState("");
  const [sheetFilters, setSheetFilters] = useState<RequestsFilters>(DEFAULT_REQUESTS_FILTERS);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Compose the React Query filters from the sheet state + the search input.
  // Search lives outside the sheet so typing doesn't require opening the sheet.
  const filters = useMemo(
    () => ({
      kind: sheetFilters.kind,
      statusBucket: sheetFilters.statusBucket,
      priority: sheetFilters.priority === "all" ? undefined : sheetFilters.priority,
      sort: sheetFilters.sort,
      from: sheetFilters.from,
      to: sheetFilters.to,
      search: searchInput.trim() || undefined,
    }),
    [sheetFilters, searchInput]
  );

  const activeFilterCount = countActiveFilters({ ...sheetFilters, search: searchInput });

  const {
    requests,
    total,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error,
  } = useAdminRequestsList(filters);

  // RefreshControl gets its OWN pulled-state, decoupled from React Query's
  // background `isRefetching`. Without this the spinner appears whenever
  // anything invalidates the list cache (e.g. coming back from
  // AdminRequestDetailScreen after a workflow PATCH) — the user sees an
  // endlessly-spinning pull-to-refresh indicator they never triggered.
  const [pulled, setPulled] = useState(false);
  const handlePull = async () => {
    setPulled(true);
    try {
      await refetch();
    } finally {
      setPulled(false);
    }
  };

  const handleRowPress = (item: AdminOpsRequest) => {
    // Phase 2: both kinds route to the new AdminRequestDetailScreen — a real
    // pushed screen with the working Advance action. The old "open ServiceRequest
    // for service" path is gone; everything goes through the unified admin detail.
    navigation.navigate("AdminRequestDetail", { id: item.id, kind: item.kind });
  };

  const renderItem = ({ item }: { item: AdminOpsRequest }) => {
    const ownerName =
      item.company?.displayName ||
      item.createdBy?.displayName ||
      item.createdBy?.email ||
      "Unknown owner";
    const assignee = item.assignedTo?.displayName || item.assignedTo?.email;
    const subtitle = assignee
      ? `${KIND_LABELS[item.kind]} • ${ownerName}\n👤 ${assignee}`
      : `${KIND_LABELS[item.kind]} • ${ownerName}`;

    return (
      <View style={{ marginHorizontal: spacing.lg, marginBottom: spacing.sm }}>
        <AdminListCard
          title={item.title || "Untitled request"}
          subtitle={subtitle}
          avatarText={(item.title || "?")[0]?.toUpperCase()}
          status={{
            label: toStatusLabel(item.status),
            type: statusType(item.status),
          }}
          meta={`${formatRelativeAge(item.updatedAt)} • ${item.priority || "normal"} priority`}
          onPress={() => handleRowPress(item)}
        />
      </View>
    );
  };

  const skeletonCount = isLoading ? Math.min(REQUESTS_PAGE_SIZE, 5) : 0;

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={{ gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <View
              key={`skeleton-${i}`}
              style={{
                height: 90,
                borderRadius: radius.lg,
                backgroundColor: colors.surface,
                opacity: 0.5,
              }}
            />
          ))}
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.error }]}>Failed to load requests</Text>
          <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
            {(error as Error)?.message || "Tap below to retry."}
          </Text>
          <Text
            style={[styles.retryLink, { color: colors.primary }]}
            onPress={() => refetch()}
          >
            Retry
          </Text>
        </View>
      );
    }

    const hasFilters = activeFilterCount > 0;
    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {hasFilters ? "No requests match" : "You're all caught up"}
        </Text>
        <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
          {hasFilters
            ? "Try clearing some filters above, or widen the date range."
            : "No open requests right now. Tap Filters to switch to a different view."}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }
    if (!hasNextPage && requests.length > 0) {
      return (
        <View style={styles.footerEnd}>
          <Text style={[styles.footerEndText, { color: colors.textMuted }]}>
            Showing {requests.length} of {total}
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: neuCardBg(isDark) }]}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm }}>
        <AdminSearchBar
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search title, owner, or reference..."
        />

        {/* Filters row — single button opens RequestsFilterSheet, badge shows
            how many axes are constrained. Active filters render as removable
            chips so the admin can see + clear them without re-opening the sheet. */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setSheetVisible(true)}
            style={[
              styles.filterButton,
              {
                backgroundColor: activeFilterCount > 0 ? colors.primary + "1a" : colors.surface,
                borderColor: activeFilterCount > 0 ? colors.primary : colors.border,
                borderRadius: radius.pill,
              },
            ]}
          >
            <Ionicons
              name="options-outline"
              size={16}
              color={activeFilterCount > 0 ? colors.primary : colors.text}
            />
            <Text
              style={[
                styles.filterButtonText,
                { color: activeFilterCount > 0 ? colors.primary : colors.text },
              ]}
            >
              Filters
            </Text>
            {activeFilterCount > 0 ? (
              <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.filterBadgeText, { color: colors.textOnPrimary }]}>
                  {activeFilterCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>

          {activeFilterCount > 0 ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setSheetFilters(DEFAULT_REQUESTS_FILTERS);
                setSearchInput("");
              }}
              hitSlop={8}
            >
              <Text style={[styles.clearAllText, { color: colors.textMuted }]}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Active filter chips — each is removable. Renders only the dimensions
            that differ from defaults. */}
        {activeFilterCount > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.xs, paddingRight: spacing.lg }}
          >
            {sheetFilters.kind !== "all" && (
              <ChipBadge
                label={`Kind: ${KIND_FILTER_LABELS[sheetFilters.kind]}`}
                onRemove={() => setSheetFilters((p) => ({ ...p, kind: "all" }))}
              />
            )}
            {sheetFilters.statusBucket !== "all" && sheetFilters.statusBucket !== "open" && (
              <ChipBadge
                label={`Status: ${STATUS_BUCKET_LABELS[sheetFilters.statusBucket]}`}
                onRemove={() => setSheetFilters((p) => ({ ...p, statusBucket: "open" }))}
              />
            )}
            {sheetFilters.priority !== "all" && (
              <ChipBadge
                label={`Priority: ${PRIORITY_LABELS[sheetFilters.priority]}`}
                onRemove={() => setSheetFilters((p) => ({ ...p, priority: "all" }))}
              />
            )}
            {sheetFilters.sort !== "updatedAt:desc" && (
              <ChipBadge
                label={`Sort: ${SORT_LABELS[sheetFilters.sort]}`}
                onRemove={() => setSheetFilters((p) => ({ ...p, sort: "updatedAt:desc" }))}
              />
            )}
            {sheetFilters.from && (
              <ChipBadge
                label={`From ${sheetFilters.from}`}
                onRemove={() => setSheetFilters((p) => ({ ...p, from: undefined }))}
              />
            )}
            {sheetFilters.to && (
              <ChipBadge
                label={`To ${sheetFilters.to}`}
                onRemove={() => setSheetFilters((p) => ({ ...p, to: undefined }))}
              />
            )}
            {searchInput.trim() && (
              <ChipBadge
                label={`"${searchInput.trim()}"`}
                onRemove={() => setSearchInput("")}
              />
            )}
          </ScrollView>
        ) : null}
      </View>

      <RequestsFilterSheet
        visible={sheetVisible}
        initial={sheetFilters}
        onClose={() => setSheetVisible(false)}
        onApply={setSheetFilters}
      />

      <FlatList
        data={requests}
        keyExtractor={(item) => `${item.kind}:${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: spacing.xxl }}
        ListEmptyComponent={renderEmpty()}
        ListFooterComponent={renderFooter()}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={pulled}
            onRefresh={handlePull}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

/**
 * Removable filter chip — shown above the list when a filter is active.
 * Tap the X icon to clear that dimension. Defined inline because it isn't
 * used anywhere else; promote to components/admin if a second consumer appears.
 */
const ChipBadge = ({ label, onRemove }: { label: string; onRemove: () => void }) => {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        styles.activeChip,
        {
          borderRadius: radius.pill,
          backgroundColor: colors.primary + "14",
          borderColor: colors.primary + "44",
        },
      ]}
    >
      <Text style={[styles.activeChipText, { color: colors.primary }]} numberOfLines={1}>
        {label}
      </Text>
      <TouchableOpacity onPress={onRemove} hitSlop={8} style={styles.activeChipClose}>
        <Ionicons name="close" size={12} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyHint: { fontSize: 13, fontWeight: "500", textAlign: "center", lineHeight: 18 },
  retryLink: { marginTop: 12, fontSize: 14, fontWeight: "700" },
  footerLoader: { paddingVertical: 24, alignItems: "center" },
  footerEnd: { paddingVertical: 16, alignItems: "center" },
  footerEndText: { fontSize: 12, fontWeight: "600" },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
  },
  filterButtonText: { fontSize: 13, fontWeight: "800" },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  filterBadgeText: { fontSize: 10, fontWeight: "900" },
  clearAllText: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  activeChipText: { fontSize: 12, fontWeight: "700", maxWidth: 200 },
  activeChipClose: { marginLeft: 2 },
});
