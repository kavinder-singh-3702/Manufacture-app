import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { RootStackParamList } from "../../navigation/types";
import { routes } from "../../navigation/routes";
import {
  internalInventoryService,
  type InternalInventoryDashboard,
  type InternalInventoryItem,
} from "../../services/internalInventory.service";
import { CompanyRequiredCard } from "../../components/company";
import { useToast } from "../../components/ui/Toast";
import { InternalStockAdjustSheet } from "./components/InternalStockAdjustSheet";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

const PAGE_SIZE = 20;

const formatINR = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getStatusTone = (status: InternalInventoryItem["stockStatus"]) => {
  if (status === "out_of_stock") return "out";
  if (status === "low_stock") return "low";
  return "in";
};

export const InternalInventoryScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<Nav>();
  const { user, requestLogin } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const isGuest = !user || user.role === "guest";
  const hasCompany = Boolean(user?.activeCompany);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dashboard, setDashboard] = useState<InternalInventoryDashboard | null>(null);
  const [items, setItems] = useState<InternalInventoryItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });

  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  const [adjustSheet, setAdjustSheet] = useState<{ open: boolean; item: InternalInventoryItem | null }>({
    open: false,
    item: null,
  });
  const [adjusting, setAdjusting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAll = useCallback(
    async (offset = 0, append = false) => {
      if (isGuest || !hasCompany) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        setError(null);
        setDashboard(null);
        setItems([]);
        setPagination({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });
        return;
      }

      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const [dashboardData, listData] = await Promise.all([
          internalInventoryService.getDashboard(),
          internalInventoryService.listItems({
            limit: PAGE_SIZE,
            offset,
            search: query.trim() ? query.trim() : undefined,
            status: stockFilter === "all" ? undefined : stockFilter,
            sort: "updatedAtDesc",
          }),
        ]);

        setDashboard(dashboardData);
        setItems((prev) => (append ? [...prev, ...(listData.items || [])] : listData.items || []));
        setPagination(listData.pagination || { total: 0, limit: PAGE_SIZE, offset, hasMore: false });
      } catch (err: any) {
        const message = err?.message || "Failed to load internal inventory";
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [hasCompany, isGuest, query, stockFilter]
  );

  useFocusEffect(
    useCallback(() => {
      fetchAll(0, false);
    }, [fetchAll])
  );

  useFocusEffect(
    useCallback(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchAll(0, false);
      }, 320);

      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }, [fetchAll, query, stockFilter])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll(0, false);
  }, [fetchAll]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !pagination.hasMore) return;
    const nextOffset = pagination.offset + pagination.limit;
    fetchAll(nextOffset, true);
  }, [fetchAll, loading, loadingMore, pagination.hasMore, pagination.limit, pagination.offset]);

  const openAdjust = useCallback((item: InternalInventoryItem) => {
    setAdjustSheet({ open: true, item });
  }, []);

  const closeAdjust = useCallback(() => {
    setAdjustSheet({ open: false, item: null });
  }, []);

  const handleAdjustSubmit = useCallback(
    async (payload: { movementType: "in" | "out" | "adjust"; quantity: number; unitCost?: number; note?: string }) => {
      if (!adjustSheet.item) return;
      try {
        setAdjusting(true);
        await internalInventoryService.adjustItem(adjustSheet.item._id, payload);
        toastSuccess("Stock updated", "Internal inventory is updated.");
        closeAdjust();
        await fetchAll(0, false);
      } catch (err: any) {
        toastError("Stock update failed", err?.message || "Could not adjust stock right now.");
      } finally {
        setAdjusting(false);
      }
    },
    [adjustSheet.item, closeAdjust, fetchAll, toastError, toastSuccess]
  );

  const headerMetrics = useMemo(() => {
    return {
      totalItems: dashboard?.totalItems || 0,
      totalQuantity: dashboard?.totalQuantity || 0,
      totalValue: dashboard?.totalValue || 0,
      lowStock: dashboard?.lowStockCount || 0,
      outStock: dashboard?.outOfStockCount || 0,
    };
  }, [dashboard]);

  const handleChooseCompany = useCallback(() => {
    navigation.navigate("CompanyContextPicker", {
      redirectTo: { kind: "main", screen: routes.STATS },
      source: "Internal Inventory",
    });
  }, [navigation]);

  if (isGuest) {
    return (
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, padding: spacing.lg, justifyContent: "center" }}>
          <CompanyRequiredCard
            title="Login to continue"
            description="Sign in to manage your internal stock and inventory analytics."
            primaryLabel="Login"
            onPrimaryPress={requestLogin}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!hasCompany) {
    return (
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, padding: spacing.lg, justifyContent: "center" }}>
          <CompanyRequiredCard
            description="Internal inventory is maintained per company. Choose an active company to continue."
            onPrimaryPress={handleChooseCompany}
            onSecondaryPress={() => navigation.navigate("CompanyCreate", { redirectTo: { kind: "main", screen: routes.STATS } })}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}> 
        <Text style={[styles.title, { color: colors.text }]}>Internal Inventory</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Track stock for analytics and operations.</Text>
      </View>

      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
        <View style={[styles.searchBar, { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surface }]}> 
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search internal items"
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.trim().length ? (
            <TouchableOpacity onPress={() => setQuery("")} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: spacing.sm }}>
          {(
            [
              { key: "all", label: "All" },
              { key: "in_stock", label: "In stock" },
              { key: "low_stock", label: "Low stock" },
              { key: "out_of_stock", label: "Out of stock" },
            ] as const
          ).map((chip) => {
            const active = stockFilter === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                onPress={() => setStockFilter(chip.key)}
                style={[
                  styles.filterChip,
                  {
                    borderRadius: radius.pill,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primary : colors.surface,
                  },
                ]}
              >
                <Text style={[styles.filterChipText, { color: active ? colors.textOnPrimary : colors.text }]}>{chip.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {error ? (
        <View
          style={[
            styles.errorBanner,
            {
              marginHorizontal: spacing.lg,
              borderRadius: radius.md,
              borderColor: colors.error + "35",
              backgroundColor: colors.error + "12",
            },
          ]}
        >
          <Ionicons name="warning-outline" size={18} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text, flex: 1 }]} numberOfLines={2}>
            {error}
          </Text>
          <TouchableOpacity onPress={() => fetchAll(0, false)}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading && !items.length ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading internal inventory...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md, marginBottom: spacing.md }}>
              <View
                style={[
                  styles.metricCard,
                  {
                    borderRadius: radius.lg,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    padding: spacing.md,
                  },
                ]}
              >
                <Text style={[styles.metricTitle, { color: colors.text }]}>Stock Overview</Text>
                <Text style={[styles.metricSubtitle, { color: colors.textMuted }]}>Independent from marketplace listing products.</Text>

                <View style={[styles.metricRow, { marginTop: spacing.sm }]}>
                  <Metric label="Items" value={headerMetrics.totalItems.toLocaleString("en-IN")} />
                  <Metric label="Units" value={headerMetrics.totalQuantity.toLocaleString("en-IN")} />
                  <Metric label="Value" value={formatINR(headerMetrics.totalValue)} />
                </View>

                <View style={[styles.metricRow, { marginTop: spacing.sm }]}>
                  <Metric label="Low" value={String(headerMetrics.lowStock)} tone="warning" />
                  <Metric label="Out" value={String(headerMetrics.outStock)} tone="error" />
                  <TouchableOpacity
                    onPress={() => navigation.navigate("InternalInventoryItemCreate")}
                    activeOpacity={0.85}
                    style={[styles.addButton, { borderRadius: radius.md, backgroundColor: colors.primary }]}
                  >
                    <Ionicons name="add" size={16} color={colors.textOnPrimary} />
                    <Text style={[styles.addButtonText, { color: colors.textOnPrimary }]}>Add item</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>Items</Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusTone = getStatusTone(item.stockStatus);
            const badgeColor =
              statusTone === "out"
                ? colors.error
                : statusTone === "low"
                  ? colors.warning
                  : colors.success;

            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate("InternalInventoryItemEdit", { itemId: item._id })}
                style={[
                  styles.itemCard,
                  {
                    marginHorizontal: spacing.lg,
                    marginBottom: spacing.sm,
                    borderRadius: radius.lg,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    padding: spacing.md,
                  },
                ]}
              >
                <View style={styles.itemTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemMeta, { color: colors.textMuted }]} numberOfLines={1}>
                      {item.sku ? `${item.sku} • ` : ""}
                      {item.category}
                    </Text>
                  </View>

                  <View style={[styles.badge, { borderRadius: radius.pill, backgroundColor: badgeColor + "20" }]}> 
                    <Text style={[styles.badgeText, { color: badgeColor }]}>{item.stockStatus.replace("_", " ")}</Text>
                  </View>
                </View>

                <View style={[styles.itemValuesRow, { marginTop: spacing.sm }]}> 
                  <ValuePill label="On hand" value={`${item.onHandQty} ${item.unit}`} />
                  <ValuePill label="Reorder" value={`${item.reorderLevel} ${item.unit}`} />
                </View>
                <View style={[styles.itemValuesRow, { marginTop: 8 }]}> 
                  <ValuePill label="Avg cost" value={formatINR(item.avgCost)} />
                  <ValuePill label="Value" value={formatINR(item.totalValue)} />
                </View>

                <View style={[styles.itemActionRow, { marginTop: spacing.md }]}> 
                  <TouchableOpacity
                    onPress={() => openAdjust(item)}
                    style={[styles.itemActionButton, { borderRadius: radius.md, borderColor: colors.primary, backgroundColor: colors.primary + "10" }]}
                  >
                    <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                    <Text style={[styles.itemActionText, { color: colors.primary }]}>Add stock</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("InternalInventoryItemEdit", { itemId: item._id })}
                    style={[styles.itemActionButton, { borderRadius: radius.md, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
                  >
                    <Ionicons name="create-outline" size={16} color={colors.text} />
                    <Text style={[styles.itemActionText, { color: colors.text }]}>Edit item</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={[styles.emptyState, { paddingHorizontal: spacing.lg, paddingTop: spacing.xl }]}> 
              <Ionicons name="cube-outline" size={52} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No internal items yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Add stock items for internal analytics and planning.</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("InternalInventoryItemCreate")}
                style={[styles.emptyPrimary, { borderRadius: radius.lg, backgroundColor: colors.primary }]}
              >
                <Ionicons name="add" size={18} color={colors.textOnPrimary} />
                <Text style={[styles.emptyPrimaryText, { color: colors.textOnPrimary }]}>Add Internal Item</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: spacing.md }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: spacing.xxl + 80 }}
        />
      )}

      <InternalStockAdjustSheet
        visible={adjustSheet.open}
        item={adjustSheet.item}
        loading={adjusting}
        onClose={closeAdjust}
        onSubmit={handleAdjustSubmit}
      />
    </SafeAreaView>
  );
};

const Metric = ({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "warning" | "error" }) => {
  const { colors, radius } = useTheme();

  const valueColor = tone === "warning" ? colors.warning : tone === "error" ? colors.error : colors.text;

  return (
    <View style={[styles.metricPill, { borderRadius: radius.md, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}> 
      <Text style={[styles.metricPillLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.metricPillValue, { color: valueColor }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

const ValuePill = ({ label, value }: { label: string; value: string }) => {
  const { colors, radius } = useTheme();
  return (
    <View style={[styles.valuePill, { borderRadius: radius.md, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}> 
      <Text style={[styles.valuePillLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.valuePillValue, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "600",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    paddingVertical: 8,
  },
  filterChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
  },
  retryText: {
    fontSize: 12,
    fontWeight: "700",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "600",
  },
  metricCard: {
    borderWidth: 1,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  metricSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
  metricRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "stretch",
  },
  metricPill: {
    flex: 1,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  metricPillLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metricPillValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "800",
  },
  addButton: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  itemCard: {
    borderWidth: 1,
  },
  itemTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "800",
  },
  itemMeta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  itemValuesRow: {
    flexDirection: "row",
    gap: 8,
  },
  valuePill: {
    flex: 1,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  valuePillLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  valuePillValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "700",
  },
  itemActionRow: {
    flexDirection: "row",
    gap: 8,
  },
  itemActionButton: {
    flex: 1,
    minHeight: 38,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  itemActionText: {
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    maxWidth: 280,
  },
  emptyPrimary: {
    marginTop: 8,
    minHeight: 44,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyPrimaryText: {
    fontSize: 13,
    fontWeight: "800",
  },
});

export default InternalInventoryScreen;
