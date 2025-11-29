import { useState, useCallback, useEffect } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { useTheme } from "../hooks/useTheme";
import { inventoryService, InventoryStats } from "../services/inventory.service";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 64;

// Chart colors for categories
const CATEGORY_COLORS: Record<string, string> = {
  "raw-materials": "#6C63FF",
  "packaging": "#FF8C3C",
  "machinery": "#4AC9FF",
  "safety": "#4ADE80",
  "chemicals": "#EC4899",
  "tools": "#FBBF24",
};

// ============================================================
// MAIN STATS SCREEN
// ============================================================
export const StatsScreen = () => {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const data = await inventoryService.getStats();
      setStats(data);
    } catch (err: any) {
      console.error("Failed to fetch stats:", err);
      setError(err.message || "Failed to load statistics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, [fetchStats]);

  // Build chart data from real stats
  const categoryPieData = stats?.categoryDistribution
    .filter((cat) => cat.count > 0)
    .map((cat) => ({
      value: cat.count,
      color: CATEGORY_COLORS[cat.id] || "#6C63FF",
      text: `${cat.count}`,
      label: cat.label,
    })) || [];

  const totalItems = stats?.totalItems || 0;
  const totalQuantity = stats?.totalQuantity || 0;
  const totalValue = stats?.totalCostValue || 0;
  const lowStockCount = stats?.lowStockCount || 0;
  const outOfStockCount = stats?.outOfStockCount || 0;

  // Quick stats cards from real data
  const statCards = [
    {
      label: "Total Items",
      value: totalItems.toString(),
      trend: "neutral" as const,
      trendValue: `${totalQuantity} units`,
      color: "#6C63FF",
    },
    {
      label: "Inventory Value",
      value: `₹${(totalValue / 1000).toFixed(1)}K`,
      trend: "neutral" as const,
      trendValue: "Cost value",
      color: "#4ADE80",
    },
    {
      label: "Low Stock",
      value: lowStockCount.toString(),
      trend: lowStockCount > 0 ? ("down" as const) : ("neutral" as const),
      trendValue: lowStockCount > 0 ? "Needs attention" : "All good",
      color: "#FBBF24",
    },
    {
      label: "Out of Stock",
      value: outOfStockCount.toString(),
      trend: outOfStockCount > 0 ? ("down" as const) : ("neutral" as const),
      trendValue: outOfStockCount > 0 ? "Critical" : "All stocked",
      color: "#FF6B6B",
    },
  ];

  // Category bar data
  const categoryBarData = stats?.categoryDistribution.map((cat) => ({
    value: cat.totalQuantity,
    label: cat.label.split(" ")[0],
    frontColor: CATEGORY_COLORS[cat.id] || "#6C63FF",
  })) || [];

  const maxQuantity = Math.max(...categoryBarData.map((d) => d.value), 10);

  if (loading) {
    return (
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.centered, { flex: 1 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 12 }]}>
            Loading statistics...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl + insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Inventory Stats</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            Track your inventory performance
          </Text>
        </View>

        {/* Error State */}
        {error && (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: colors.error + "20", padding: spacing.md, borderRadius: 8, marginBottom: spacing.lg },
            ]}
          >
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity onPress={fetchStats}>
              <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Stats Cards */}
        <View style={[styles.statsGrid, { gap: spacing.md, marginBottom: spacing.xl }]}>
          {statCards.map((stat, index) => (
            <QuickStatCard key={index} data={stat} />
          ))}
        </View>

        {/* Category Quantity Chart */}
        {categoryBarData.length > 0 && (
          <ChartCard title="Quantity by Category">
            <BarChart
              data={categoryBarData}
              width={CHART_WIDTH}
              height={180}
              barWidth={32}
              spacing={20}
              roundedTop
              roundedBottom
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
              noOfSections={4}
              maxValue={maxQuantity * 1.2}
              isAnimated
              animationDuration={500}
              barBorderRadius={6}
            />
          </ChartCard>
        )}

        {/* Category Distribution Pie */}
        {categoryPieData.length > 0 ? (
          <ChartCard title="Items by Category">
            <View style={styles.pieContainer}>
              <PieChart
                data={categoryPieData}
                donut
                radius={80}
                innerRadius={50}
                innerCircleColor={colors.surface}
                centerLabelComponent={() => (
                  <View style={styles.pieCenter}>
                    <Text style={[styles.pieCenterValue, { color: colors.text }]}>{totalItems}</Text>
                    <Text style={[styles.pieCenterLabel, { color: colors.textMuted }]}>Items</Text>
                  </View>
                )}
                isAnimated
              />
              <View style={[styles.pieLegend, { marginLeft: spacing.lg }]}>
                {categoryPieData.map((item, index) => (
                  <View key={index} style={styles.pieLegendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.legendValue, { color: colors.text }]}>{item.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ChartCard>
        ) : (
          <ChartCard title="Items by Category">
            <View style={[styles.emptyState, { padding: spacing.xl }]}>
              <Text style={[styles.emptyIcon]}>📦</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No inventory yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Add items to see distribution
              </Text>
            </View>
          </ChartCard>
        )}

        {/* Status Breakdown */}
        <ChartCard title="Stock Status">
          <View style={{ gap: spacing.md }}>
            <StatusRow
              label="Active"
              count={stats?.statusBreakdown.active || 0}
              total={totalItems}
              color="#4ADE80"
            />
            <StatusRow
              label="Low Stock"
              count={stats?.statusBreakdown.low_stock || 0}
              total={totalItems}
              color="#FBBF24"
            />
            <StatusRow
              label="Out of Stock"
              count={stats?.statusBreakdown.out_of_stock || 0}
              total={totalItems}
              color="#FF6B6B"
            />
            <StatusRow
              label="Discontinued"
              count={stats?.statusBreakdown.discontinued || 0}
              total={totalItems}
              color="#6B7280"
            />
          </View>
        </ChartCard>

        {/* Summary Highlights */}
        <ChartCard title="Quick Summary">
          <View style={{ gap: spacing.md }}>
            <HighlightItem
              icon="📦"
              title="Total Unique Items"
              value={totalItems.toString()}
              detail="Across all categories"
            />
            <HighlightItem
              icon="🔢"
              title="Total Quantity"
              value={totalQuantity.toLocaleString()}
              detail="Units in stock"
            />
            <HighlightItem
              icon="💰"
              title="Inventory Value"
              value={`₹${totalValue.toLocaleString()}`}
              detail="Total cost value"
            />
            <HighlightItem
              icon="⚠️"
              title="Attention Needed"
              value={(lowStockCount + outOfStockCount).toString()}
              detail="Items need restocking"
            />
          </View>
        </ChartCard>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================
// COMPONENTS
// ============================================================
type StatCardData = {
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  color: string;
};

const QuickStatCard = ({ data }: { data: StatCardData }) => {
  const { colors, spacing, radius } = useTheme();
  const trendIcon = data.trend === "up" ? "↑" : data.trend === "down" ? "↓" : "→";
  const trendColor =
    data.trend === "up" ? colors.success : data.trend === "down" ? colors.error : colors.textMuted;

  return (
    <View
      style={[
        styles.quickStatCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing.md,
        },
      ]}
    >
      <View style={[styles.statAccent, { backgroundColor: data.color }]} />
      <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>{data.label}</Text>
      <Text style={[styles.quickStatValue, { color: colors.text }]}>{data.value}</Text>
      <View style={styles.trendRow}>
        <Text style={[styles.trendIcon, { color: trendColor }]}>{trendIcon}</Text>
        <Text style={[styles.trendValue, { color: trendColor }]}>{data.trendValue}</Text>
      </View>
    </View>
  );
};

type ChartCardProps = {
  title: string;
  children: React.ReactNode;
};

const ChartCard = ({ title, children }: ChartCardProps) => {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={[
        styles.chartCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.lg,
        },
      ]}
    >
      <Text style={[styles.chartTitle, { color: colors.text, marginBottom: spacing.md }]}>
        {title}
      </Text>
      {children}
    </View>
  );
};

type StatusRowProps = {
  label: string;
  count: number;
  total: number;
  color: string;
};

const StatusRow = ({ label, count, total, color }: StatusRowProps) => {
  const { colors, spacing, radius } = useTheme();
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <View style={styles.statusRow}>
      <View style={styles.statusLabelRow}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.statusCount, { color: colors.text }]}>{count}</Text>
      </View>
      <View style={[styles.statusBarBg, { backgroundColor: colors.border, borderRadius: radius.sm }]}>
        <View
          style={[
            styles.statusBarFill,
            { width: `${percentage}%`, backgroundColor: color, borderRadius: radius.sm },
          ]}
        />
      </View>
    </View>
  );
};

type HighlightItemProps = {
  icon: string;
  title: string;
  value: string;
  detail: string;
};

const HighlightItem = ({ icon, title, value, detail }: HighlightItemProps) => {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={[
        styles.highlightItem,
        {
          backgroundColor: colors.backgroundTertiary,
          borderRadius: radius.md,
          padding: spacing.md,
        },
      ]}
    >
      <Text style={styles.highlightIcon}>{icon}</Text>
      <View style={styles.highlightContent}>
        <Text style={[styles.highlightTitle, { color: colors.textSecondary }]}>{title}</Text>
        <Text style={[styles.highlightValue, { color: colors.text }]}>{value}</Text>
      </View>
      <Text style={[styles.highlightDetail, { color: colors.textMuted }]}>{detail}</Text>
    </View>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  errorBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  quickStatCard: {
    width: "48%",
    borderWidth: 1,
    overflow: "hidden",
  },
  statAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 4,
    height: "100%",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  quickStatLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  trendIcon: {
    fontSize: 14,
    fontWeight: "700",
  },
  trendValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  chartCard: {
    borderWidth: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "500",
  },
  legendValue: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: "auto",
  },
  pieContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  pieCenter: {
    alignItems: "center",
  },
  pieCenterValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  pieCenterLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  pieLegend: {
    flex: 1,
    gap: 8,
  },
  pieLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyState: {
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  statusRow: {
    gap: 6,
  },
  statusLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  statusCount: {
    fontSize: 13,
    fontWeight: "700",
  },
  statusBarBg: {
    height: 6,
    overflow: "hidden",
  },
  statusBarFill: {
    height: "100%",
  },
  highlightItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  highlightIcon: {
    fontSize: 28,
  },
  highlightContent: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  highlightValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  highlightDetail: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "right",
  },
});
