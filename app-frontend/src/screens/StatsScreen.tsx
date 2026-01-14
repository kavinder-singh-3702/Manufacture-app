import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  ScrollView,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { AppRole } from "../constants/roles";
import { productService, ProductStats, Product } from "../services/product.service";
import { RootStackParamList } from "../navigation/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 64;

const CATEGORY_COLORS: Record<string, string> = {
  "food-beverage-manufacturing": "#F59E0B",
  "textile-apparel-manufacturing": "#A855F7",
  "paper-packaging-industry": "#06B6D4",
  "chemical-manufacturing": "#F97316",
  "pharmaceutical-medical": "#6366F1",
  "plastic-polymer-industry": "#22C55E",
  "rubber-industry": "#FBBF24",
  "metal-steel-industry": "#6B7280",
  "automobile-auto-components": "#EF4444",
  "electrical-electronics-manufacturing": "#3B82F6",
  "machinery-heavy-engineering": "#4F46E5",
  "wood-furniture-industry": "#D97706",
  "construction-material-industry": "#EA580C",
  "leather-industry": "#B45309",
  "petroleum-energy-manufacturing": "#FB7185",
  "defence-aerospace-manufacturing": "#0EA5E9",
  "consumer-goods-fmcg": "#10B981",
  "printing-publishing": "#64748B",
  "toys-sports-goods": "#14B8A6",
  "handicrafts-cottage-industries": "#EC4899",
  "finished-goods": "#6C63FF",
  components: "#FF8C3C",
  "raw-materials": "#4AC9FF",
  machinery: "#4ADE80",
  packaging: "#EC4899",
  services: "#FBBF24",
  other: "#6B7280",
};

// ============================================================
// MAIN STATS SCREEN
// ============================================================
export const StatsScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedBarValue, setSelectedBarValue] = useState<{ label: string; value: number } | null>(null);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const heroGlow = useRef(new Animated.Value(0)).current;
  const heroReveal = useRef(new Animated.Value(0)).current;
  const contentReveal = useRef(new Animated.Value(0)).current;

  const isGuest = user?.role === AppRole.GUEST;

  const fetchStats = useCallback(async () => {
    if (isGuest) {
      setStats(null);
      setError(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setError(null);
      const data = await productService.getStats();
      setStats(data);
    } catch (err: any) {
      console.error("Failed to fetch stats:", err);
      setError(err.message || "Failed to load statistics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isGuest]);

  // Fetch user's own products for the table
  const fetchUserProducts = useCallback(async () => {
    if (isGuest) {
      setUserProducts([]);
      setProductsLoading(false);
      return;
    }
    try {
      setProductsLoading(true);
      const response = await productService.getAll({ scope: "company", limit: 100 });
      setUserProducts(response.products || []);
    } catch (err: any) {
      console.error("Failed to fetch user products:", err);
    } finally {
      setProductsLoading(false);
    }
  }, [isGuest]);

  // Refresh stats whenever screen comes into focus (e.g., after deleting a product)
  useFocusEffect(
    useCallback(() => {
      fetchStats();
      fetchUserProducts();
    }, [fetchStats, fetchUserProducts])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
    fetchUserProducts();
  }, [fetchStats, fetchUserProducts]);

  // Subtle hero glow and reveal animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(heroGlow, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(heroGlow, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [heroGlow]);

  useEffect(() => {
    if (!loading) {
      heroReveal.setValue(0);
      contentReveal.setValue(0);

      Animated.parallel([
        Animated.timing(heroReveal, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(contentReveal, {
          toValue: 1,
          duration: 420,
          delay: 80,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [contentReveal, heroReveal, loading]);

  // Build chart data from real stats
  const categoryPieData = useMemo(
    () =>
      stats?.categoryDistribution
        .filter((cat) => cat.count > 0)
        .map((cat) => ({
          value: cat.count,
          color: CATEGORY_COLORS[cat.id] || colors.primary,
          text: `${cat.count}`,
          label: cat.label,
        })) || [],
    [colors.primary, stats?.categoryDistribution]
  );

  const categoryBarData = useMemo(() => {
    if (!stats?.categoryDistribution) return [];

    const data = stats.categoryDistribution
      .filter((cat) => cat.count > 0) // Only show categories with products
      .map((cat) => {
        // Use count (number of items) instead of totalQuantity if totalQuantity is 0
        const quantity = typeof cat.totalQuantity === "number" && cat.totalQuantity > 0
          ? cat.totalQuantity
          : (typeof cat.count === "number" ? cat.count : 0);

        return {
          value: quantity,
          label: cat.label?.split(" ")[0]?.substring(0, 6) || "Other",
          frontColor: CATEGORY_COLORS[cat.id] || colors.primary,
          topLabelComponent: () => (
            <Text style={{ color: colors.text, fontSize: 9, fontWeight: "700" }}>
              {quantity}
            </Text>
          ),
          onPress: () => setSelectedBarValue({ label: cat.label || "Category", value: quantity }),
        };
      });

    return data;
  }, [colors.primary, colors.text, stats?.categoryDistribution]);

  const maxQuantity = useMemo(() => {
    if (categoryBarData.length === 0) return 100;
    const values = categoryBarData.map((d) => d.value || 0);
    const max = Math.max(...values);
    return max > 0 ? max : 100;
  }, [categoryBarData]);

  const totalItems = stats?.totalItems || 0;
  const totalQuantity = stats?.totalQuantity || 0;
  const totalValue = stats?.totalCostValue || 0;
  const lowStockCount = stats?.lowStockCount || 0;
  const outOfStockCount = stats?.outOfStockCount || 0;
  const stockHealth =
    totalItems > 0 ? Math.round(((stats?.statusBreakdown.in_stock || 0) / totalItems) * 100) : 0;
  const averageUnits = totalItems > 0 ? Math.round(totalQuantity / totalItems) : 0;

  // Navigation handlers for clickable stats
  const handleLowStockPress = useCallback(() => {
    navigation.navigate("FilteredProducts", { filter: "low_stock", title: "Low Stock Products" });
  }, [navigation]);

  const handleOutOfStockPress = useCallback(() => {
    navigation.navigate("FilteredProducts", { filter: "out_of_stock", title: "Out of Stock Products" });
  }, [navigation]);

  // Quick stats cards from real data
  const statCards = useMemo(
    () => [
      {
        label: "Total Items",
        value: totalItems.toString(),
        trend: "neutral" as const,
        trendValue: `${totalQuantity.toLocaleString()} units`,
        color: colors.primary,
        onPress: undefined,
        icon: "📦",
      },
      {
        label: "Product Value",
        value: `₹${(totalValue / 1000).toFixed(1)}K`,
        trend: "neutral" as const,
        trendValue: "Cost basis",
        color: colors.success,
        onPress: undefined,
        icon: "💰",
      },
      {
        label: "Low Stock",
        value: lowStockCount.toString(),
        trend: lowStockCount > 0 ? ("down" as const) : ("neutral" as const),
        trendValue: lowStockCount > 0 ? "Tap to view →" : "All good",
        color: colors.warning,
        onPress: lowStockCount > 0 ? handleLowStockPress : undefined,
        icon: "⚠️",
      },
      {
        label: "Out of Stock",
        value: outOfStockCount.toString(),
        trend: outOfStockCount > 0 ? ("down" as const) : ("neutral" as const),
        trendValue: outOfStockCount > 0 ? "Tap to view →" : "All stocked",
        color: colors.error,
        onPress: outOfStockCount > 0 ? handleOutOfStockPress : undefined,
        icon: "⛔️",
      },
    ],
    [
      colors.error,
      colors.primary,
      colors.success,
      colors.warning,
      handleLowStockPress,
      handleOutOfStockPress,
      lowStockCount,
      outOfStockCount,
      totalItems,
      totalQuantity,
      totalValue,
    ]
  );

  const actionPills = useMemo(
    () => [
      {
        label: "Low stock queue",
        value: `${lowStockCount} item${lowStockCount === 1 ? "" : "s"}`,
        accent: colors.warning,
        icon: "🩺",
        onPress: lowStockCount > 0 ? handleLowStockPress : undefined,
        hint: lowStockCount > 0 ? "Prioritize replenishment" : "No alerts",
      },
      {
        label: "Stockouts",
        value: `${outOfStockCount} item${outOfStockCount === 1 ? "" : "s"}`,
        accent: colors.error,
        icon: "🚫",
        onPress: outOfStockCount > 0 ? handleOutOfStockPress : undefined,
        hint: outOfStockCount > 0 ? "Hidden from buyers" : "All visible",
      },
      {
        label: "Health score",
        value: `${stockHealth}%`,
        accent: colors.success,
        icon: "✅",
        hint: "In-stock coverage",
      },
    ],
    [
      colors.error,
      colors.success,
      colors.warning,
      handleLowStockPress,
      handleOutOfStockPress,
      lowStockCount,
      outOfStockCount,
      stockHealth,
    ]
  );

  // Calculate proper chart width to prevent overflow
  const barCount = categoryBarData.length || 1;
  const calculatedBarWidth = Math.min(32, (CHART_WIDTH - 60) / barCount - 12);
  const calculatedSpacing = Math.min(16, (CHART_WIDTH - 60 - calculatedBarWidth * barCount) / (barCount + 1));

  const heroTranslate = heroReveal.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const contentTranslate = contentReveal.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  const heroGlowOpacity = heroGlow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.65] });
  const heroGlowScale = heroGlow.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.08] });

  if (loading) {
    return (
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.centered, { flex: 1 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 12 }]}>
            Preparing your inventory insights...
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Hero */}
        <Animated.View
          style={[
            styles.heroWrapper,
            {
              opacity: heroReveal,
              transform: [{ translateY: heroTranslate }],
            },
          ]}
        >
          <LinearGradient
            colors={[colors.primary, colors.accentWarm, colors.backgroundSecondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.heroCard,
              {
                borderRadius: radius.lg,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.heroGlow,
                {
                  opacity: heroGlowOpacity,
                  transform: [{ scale: heroGlowScale }],
                  backgroundColor: colors.primaryGlow,
                },
              ]}
            />
            <View style={[styles.heroTopRow, { marginBottom: spacing.md }]}>
              <View style={{ flex: 1, gap: spacing.xs }}>
                <Text style={[styles.pageEyebrow, { color: colors.textMuted }]}>Product Intelligence</Text>
                <Text style={[styles.pageTitle, { color: colors.text }]}>Product Stats</Text>
                <Text style={[styles.pageSubtitle, { color: colors.textLight }]}>
                  Premium dashboard for inventory momentum
                </Text>
              </View>
              <View
                style={[
                  styles.heroBadge,
                  {
                    borderColor: colors.primary + "60",
                    backgroundColor: colors.primary + "20",
                  },
                ]}
              >
                <Text style={[styles.heroBadgeText, { color: colors.text }]}>LIVE</Text>
              </View>
            </View>

            <View style={[styles.heroMetricsRow, { marginBottom: spacing.sm }]}>
              <HeroMetric
                label="Catalog value"
                value={`₹${(totalValue / 1000).toFixed(1)}K`}
                hint="Cost basis"
              />
              <HeroMetric label="Stock health" value={`${stockHealth}%`} hint="Ready to ship" />
            </View>
            <View style={styles.heroMetricsRow}>
              <HeroMetric
                label="Total items"
                value={totalItems.toString()}
                hint={`${totalQuantity.toLocaleString()} units on hand`}
              />
              <HeroMetric label="Avg units / item" value={averageUnits.toString()} hint="Depth per SKU" />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* My Products Table - Right below hero */}
        <SectionHeader
          title="My Products"
          subtitle="Tap to view all your listed products"
          onPress={() => navigation.navigate("MyProducts")}
          showArrow
        />
        <ProductTable products={userProducts} loading={productsLoading} />

        {/* Error State */}
        {error && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.error + "18",
                padding: spacing.md,
                borderRadius: radius.md,
                borderColor: colors.error + "30",
                borderWidth: 1,
                marginBottom: spacing.lg,
              },
            ]}
          >
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity onPress={fetchStats}>
              <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <Animated.View
          style={{
            opacity: contentReveal,
            transform: [{ translateY: contentTranslate }],
          }}
        >
          {/* Quick Stats Cards */}
          <SectionHeader title="Inventory Pulse" subtitle="High-level view of your catalog" />
          <View style={[styles.statsGrid, { marginBottom: spacing.lg }]}>
            {statCards.map((stat, index) => (
              <QuickStatCard key={index} data={stat} />
            ))}
          </View>

          {/* Action Pills */}
          <SectionHeader title="Alerts & Actions" subtitle="Stay ahead of low stock and outages" />
          <View style={styles.actionPillsRow}>
            {actionPills.map((pill, index) => (
              <InsightPill
                key={`${pill.label}-${index}`}
                {...pill}
                muted={!pill.onPress}
              />
            ))}
          </View>

          {/* Category Quantity Chart */}
          {categoryBarData.length > 0 && (
            <ChartCard title="Quantity by Category" subtitle="Live on-hand quantity across categories">
              {selectedBarValue && (
                <TouchableOpacity
                  onPress={() => setSelectedBarValue(null)}
                  style={[
                    styles.selectedValueBanner,
                    {
                      backgroundColor: colors.primary + "12",
                      borderColor: colors.primary + "25",
                    },
                  ]}
                >
                  <Text style={[styles.selectedValueText, { color: colors.text }]}>
                    {selectedBarValue.label}:{" "}
                    <Text style={styles.selectedValueNumber}>{selectedBarValue.value.toLocaleString()} units</Text>
                  </Text>
                  <Text style={[styles.selectedValueHint, { color: colors.textMuted }]}>Tap to dismiss</Text>
                </TouchableOpacity>
              )}
              <View style={styles.chartContainer}>
                <BarChart
                  data={categoryBarData}
                  width={CHART_WIDTH - 60}
                  height={160}
                  barWidth={Math.max(20, calculatedBarWidth)}
                  spacing={Math.max(8, calculatedSpacing)}
                  initialSpacing={10}
                  endSpacing={10}
                  roundedTop
                  hideRules={false}
                  rulesColor={colors.border + "30"}
                  rulesType="dashed"
                  dashWidth={3}
                  dashGap={3}
                  xAxisThickness={1}
                  xAxisColor={colors.border}
                  yAxisThickness={0}
                  hideYAxisText
                  xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 8, marginTop: 4 }}
                  noOfSections={4}
                  maxValue={Math.ceil(maxQuantity * 1.3)}
                  isAnimated
                  animationDuration={400}
                  barBorderRadius={4}
                  renderTooltip={(item: any) => (
                    <View style={{ backgroundColor: colors.surface, padding: 6, borderRadius: 6, marginBottom: 4 }}>
                      <Text style={{ color: colors.text, fontSize: 10, fontWeight: "700" }}>{item.value}</Text>
                    </View>
                  )}
                  disableScroll
                  frontColor={colors.primary}
                  showGradient
                  gradientColor={colors.primary + "60"}
                />
              </View>
              <Text style={[styles.chartHint, { color: colors.textMuted }]}>Tap bars to see exact quantity</Text>
            </ChartCard>
          )}

          {/* Category Distribution Pie */}
          {categoryPieData.length > 0 ? (
            <ChartCard title="Items by Category" subtitle="Catalog distribution by category">
              <View style={styles.pieContainer}>
                <PieChart
                  data={categoryPieData}
                  donut
                  radius={82}
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
                      <Text style={[styles.legendText, { color: colors.textSecondary }]}>{item.label}</Text>
                      <Text style={[styles.legendValue, { color: colors.text }]}>{item.text}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ChartCard>
          ) : (
            <ChartCard title="Products by Category" subtitle="Add products to unlock category insights">
              <View style={[styles.emptyState, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={[styles.emptyIcon]}>📦</Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No products yet</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Add products to see distribution</Text>
              </View>
            </ChartCard>
          )}

          {/* Status Breakdown */}
          <ChartCard title="Stock Status" subtitle="Where to focus your next actions">
            <View style={{ gap: spacing.md }}>
              <StatusRow
                label="In Stock"
                count={stats?.statusBreakdown.in_stock || 0}
                total={totalItems}
                color={colors.success}
              />
              <StatusRow
                label="Low Stock"
                count={stats?.statusBreakdown.low_stock || 0}
                total={totalItems}
                color={colors.warning}
              />
              <StatusRow
                label="Out of Stock"
                count={stats?.statusBreakdown.out_of_stock || 0}
                total={totalItems}
                color={colors.error}
              />
            </View>
          </ChartCard>

          {/* Summary Highlights */}
          <ChartCard title="Operational Signals" subtitle="Quick summary for your ops team">
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
                title="Product Value"
                value={`₹${totalValue.toLocaleString()}`}
                detail="Total value"
              />
              <HighlightItem
                icon="⚠️"
                title="Attention Needed"
                value={(lowStockCount + outOfStockCount).toString()}
                detail="Items need restocking"
              />
            </View>
          </ChartCard>
        </Animated.View>
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
  icon: string;
  onPress?: () => void;
};

const SectionHeader = ({ title, subtitle, onPress, showArrow }: { title: string; subtitle?: string; onPress?: () => void; showArrow?: boolean }) => {
  const { colors, spacing } = useTheme();

  const content = (
    <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
      <View style={styles.sectionHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
        </View>
        {showArrow && (
          <View style={[styles.sectionArrowContainer, { backgroundColor: colors.primary }]}>
            <Text style={[styles.sectionArrow, { color: "#fff" }]}>›</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const HeroMetric = ({ label, value, hint }: { label: string; value: string; hint: string }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.heroMetric,
        {
          backgroundColor: colors.overlayLight,
          borderColor: colors.border + "60",
        },
      ]}
    >
      <Text style={[styles.heroMetricLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.heroMetricValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.heroMetricHint, { color: colors.textMuted }]}>{hint}</Text>
    </View>
  );
};

const QuickStatCard = ({ data }: { data: StatCardData }) => {
  const { colors, radius, spacing } = useTheme();
  const isClickable = !!data.onPress;
  const tagLabel = isClickable ? "View" : "Live";
  const tagColor = isClickable ? data.color : colors.textMuted;
  const tagBorder = isClickable ? data.color + "35" : colors.border;
  const tagBackground = isClickable ? data.color + "18" : colors.backgroundSecondary;

  const content = (
    <View
      style={[
        styles.quickStatCard,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: data.color + "35",
          borderRadius: radius.md,
          padding: spacing.md,
          shadowColor: data.color,
        },
      ]}
    >
      <View style={styles.quickStatHeader}>
        <View style={[styles.quickStatIcon, { backgroundColor: data.color + "25" }]}>
          <Text>{data.icon}</Text>
        </View>
        <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]} numberOfLines={2}>
          {data.label}
        </Text>
        <View style={[styles.quickStatTag, { backgroundColor: tagBackground, borderColor: tagBorder }]}>
          <Text style={[styles.quickStatTagText, { color: tagColor }]}>{tagLabel}</Text>
        </View>
      </View>

      <Text style={[styles.quickStatValue, { color: colors.text }]}>{data.value}</Text>
      <Text style={[styles.quickStatHint, { color: colors.textMuted }]}>{data.trendValue}</Text>
    </View>
  );

  if (isClickable) {
    return (
      <TouchableOpacity onPress={data.onPress} activeOpacity={0.8} style={{ width: "48%" }}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={{ width: "48%" }}>{content}</View>;
};

type ChartCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

const ChartCard = ({ title, subtitle, children }: ChartCardProps) => {
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
      <View style={styles.chartTitleRow}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>{title}</Text>
        <View style={[styles.chartBadge, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "35" }]}>
          <Text style={[styles.chartBadgeText, { color: colors.text }]}>{categoryLabelFromTitle(title)}</Text>
        </View>
      </View>
      {subtitle ? <Text style={[styles.chartSubtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      {children}
    </View>
  );
};

const StatusRow = ({ label, count, total, color }: { label: string; count: number; total: number; color: string }) => {
  const { colors, spacing, radius } = useTheme();
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <View style={styles.statusRow}>
      <View style={styles.statusLabelRow}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.statusCount, { color: colors.text }]}>{count}</Text>
        <Text style={[styles.statusPercent, { color: colors.textMuted }]}>{percentage.toFixed(0)}%</Text>
      </View>
      <View style={[styles.statusBarBg, { backgroundColor: colors.border, borderRadius: radius.sm }]}>
        <View
          style={[
            styles.statusBarFill,
            {
              width: `${percentage}%`,
              backgroundColor: color,
              borderRadius: radius.sm,
            },
          ]}
        />
      </View>
    </View>
  );
};

const HighlightItem = ({ icon, title, value, detail }: { icon: string; title: string; value: string; detail: string }) => {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={[
        styles.highlightItem,
        {
          backgroundColor: colors.backgroundSecondary,
          borderRadius: radius.md,
          padding: spacing.md,
          borderColor: colors.border,
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

const InsightPill = ({
  label,
  value,
  accent,
  icon,
  hint,
  onPress,
  muted = false,
}: {
  label: string;
  value: string;
  accent: string;
  icon: string;
  hint: string;
  onPress?: () => void;
  muted?: boolean;
}) => {
  const { colors } = useTheme();

  const content = (
    <View
      style={[
        styles.actionPill,
        {
          borderColor: accent + "40",
          backgroundColor: accent + "10",
        },
      ]}
    >
      <View style={[styles.quickStatIcon, { backgroundColor: accent + "25" }]}>
        <Text>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.actionPillValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.actionPillLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.actionPillHint, { color: muted ? colors.textMuted : accent }]}>{hint}</Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.actionPillWrapper}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.actionPillWrapper}>{content}</View>;
};

// Helper to show short badge text
const categoryLabelFromTitle = (title: string) => {
  if (title.toLowerCase().includes("category")) return "By Category";
  if (title.toLowerCase().includes("stock")) return "Health";
  return "Live";
};

// Product Table Component - Shows preview with "Show More" option
const PREVIEW_LIMIT = 3; // Number of products to show in preview

const ProductTable = ({ products, loading }: { products: Product[]; loading: boolean }) => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (loading) {
    return (
      <View style={[styles.tableContainer, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.tableLoadingText, { color: colors.textMuted }]}>Loading your products...</Text>
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={[styles.tableContainer, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
        <Text style={styles.tableEmptyIcon}>📦</Text>
        <Text style={[styles.tableEmptyTitle, { color: colors.text }]}>No products listed</Text>
        <Text style={[styles.tableEmptySubtitle, { color: colors.textMuted }]}>Add products to see them here</Text>
      </View>
    );
  }

  const handleProductPress = (productId: string) => {
    navigation.navigate("ProductDetails", { productId });
  };

  const handleShowMore = () => {
    navigation.navigate("MyProducts");
  };

  // Only show limited products in preview
  const previewProducts = products.slice(0, PREVIEW_LIMIT);
  const hasMore = products.length > PREVIEW_LIMIT;
  const remainingCount = products.length - PREVIEW_LIMIT;

  return (
    <View style={[styles.tableWrapper, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
      {/* Table Header */}
      <View style={[styles.tableHeader, { backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.border }]}>
        <Text style={[styles.tableHeaderCell, styles.tableColProduct, { color: colors.textSecondary }]}>Product</Text>
        <Text style={[styles.tableHeaderCell, styles.tableColPrice, { color: colors.textSecondary, textAlign: "right" }]}>Price</Text>
        <Text style={[styles.tableHeaderCell, styles.tableColStock, { color: colors.textSecondary, textAlign: "center" }]}>Stock</Text>
        <Text style={[styles.tableHeaderCell, styles.tableColStatus, { color: colors.textSecondary, textAlign: "right" }]}>Status</Text>
      </View>

      {/* Table Rows - Only show preview */}
      {previewProducts.map((product, index) => {
        const price = product.price?.amount || 0;
        const currencySymbol = product.price?.currency === "INR" ? "₹" : "₹";
        const stockQty = product.availableQuantity || 0;
        const stockStatus = product.stockStatus || (stockQty === 0 ? "out_of_stock" : stockQty <= 5 ? "low_stock" : "in_stock");

        const statusColor =
          stockStatus === "in_stock" ? colors.success :
          stockStatus === "low_stock" ? colors.warning : colors.error;

        const statusLabel =
          stockStatus === "in_stock" ? "In Stock" :
          stockStatus === "low_stock" ? "Low" : "Out";

        return (
          <TouchableOpacity
            key={product._id}
            style={[
              styles.tableRow,
              { borderBottomColor: colors.border },
              !hasMore && index === previewProducts.length - 1 && styles.tableRowLast,
            ]}
            onPress={() => handleProductPress(product._id)}
            activeOpacity={0.7}
          >
            <View style={[styles.tableCell, styles.tableColProduct]}>
              <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={[styles.productCategory, { color: colors.textMuted }]} numberOfLines={1}>
                {product.category?.replace(/-/g, " ") || "Uncategorized"}
              </Text>
            </View>
            <View style={[styles.tableCell, styles.tableColPrice]}>
              <Text style={[styles.priceText, { color: colors.text, textAlign: "right" }]}>
                {currencySymbol}{price.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.tableCell, styles.tableColStock]}>
              <Text style={[styles.stockText, { color: colors.text, textAlign: "center" }]}>{stockQty}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableColStatus]}>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + "20", borderColor: statusColor + "40" }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Show More Button */}
      {hasMore ? (
        <TouchableOpacity
          style={[styles.showMoreButton, { borderTopColor: colors.border }]}
          onPress={handleShowMore}
          activeOpacity={0.7}
        >
          <Text style={[styles.showMoreText, { color: colors.primary }]}>
            Show More ({remainingCount} more product{remainingCount !== 1 ? "s" : ""})
          </Text>
          <Text style={[styles.showMoreArrow, { color: colors.primary }]}>→</Text>
        </TouchableOpacity>
      ) : (
        /* Table Footer - Only show when no "Show More" */
        <View style={[styles.tableFooter, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.tableFooterText, { color: colors.textMuted }]}>
            Showing {products.length} product{products.length !== 1 ? "s" : ""}
          </Text>
        </View>
      )}
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
  heroWrapper: {
    marginBottom: 16,
  },
  heroCard: {
    overflow: "hidden",
    padding: 20,
    borderWidth: 1,
  },
  heroGlow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    top: -60,
    right: -80,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  pageEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  heroBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  heroMetricsRow: {
    flexDirection: "row",
    gap: 12,
  },
  heroMetric: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  heroMetricLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  heroMetricValue: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
    letterSpacing: -0.2,
  },
  heroMetricHint: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
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
    fontWeight: "700",
  },
  sectionHeader: {},
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  sectionArrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7c8aff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  sectionArrow: {
    fontSize: 28,
    fontWeight: "800",
    marginLeft: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickStatCard: {
    width: "100%",
    borderWidth: 1,
    overflow: "hidden",
  },
  quickStatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quickStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickStatLabel: {
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: "900",
    marginTop: 8,
  },
  quickStatHint: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  quickStatTag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  quickStatTagText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  chartCard: {
    borderWidth: 1,
    overflow: "hidden",
  },
  chartTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  chartSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 10,
  },
  chartBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chartBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
    paddingVertical: 10,
  },
  chartHint: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },
  selectedValueBanner: {
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
  },
  selectedValueText: {
    fontSize: 14,
    fontWeight: "700",
  },
  selectedValueNumber: {
    fontWeight: "900",
    fontSize: 16,
  },
  selectedValueHint: {
    fontSize: 10,
    marginTop: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "600",
  },
  legendValue: {
    fontSize: 12,
    fontWeight: "800",
    marginLeft: "auto",
  },
  pieContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pieCenter: {
    alignItems: "center",
  },
  pieCenterValue: {
    fontSize: 24,
    fontWeight: "900",
  },
  pieCenterLabel: {
    fontSize: 10,
    fontWeight: "700",
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
    paddingVertical: 24,
    borderWidth: 1,
    borderRadius: 12,
    gap: 6,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 2,
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
    fontWeight: "600",
    flex: 1,
  },
  statusCount: {
    fontSize: 13,
    fontWeight: "800",
  },
  statusPercent: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusBarBg: {
    height: 8,
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
    fontSize: 20,
  },
  highlightContent: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  highlightValue: {
    fontSize: 18,
    fontWeight: "900",
  },
  highlightDetail: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
  },
  actionPillsRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  actionPillWrapper: {
    width: "48%",
    minWidth: 160,
    flexGrow: 0,
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionPillValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  actionPillLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  actionPillHint: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },

  // Product Table Styles
  tableContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 16,
  },
  tableLoadingText: {
    fontSize: 13,
    marginTop: 12,
  },
  tableEmptyIcon: {
    fontSize: 48,
  },
  tableEmptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 8,
  },
  tableEmptySubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  tableWrapper: {
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCell: {
    justifyContent: "center",
  },
  tableColProduct: {
    flex: 2,
    paddingRight: 8,
  },
  tableColPrice: {
    flex: 1,
    alignItems: "flex-end",
  },
  tableColStock: {
    flex: 0.7,
    alignItems: "center",
  },
  tableColStatus: {
    flex: 1,
    alignItems: "flex-end",
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  productCategory: {
    fontSize: 10,
    marginTop: 2,
    textTransform: "capitalize",
  },
  priceText: {
    fontSize: 13,
    fontWeight: "700",
  },
  stockText: {
    fontSize: 13,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  tableFooter: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  tableFooterText: {
    fontSize: 11,
    fontWeight: "600",
  },
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: "700",
  },
  showMoreArrow: {
    fontSize: 16,
    fontWeight: "700",
  },
});
