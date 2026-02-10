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
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { AppRole } from "../constants/roles";
import { productService, type Product, type ProductStats } from "../services/product.service";
import { RootStackParamList } from "../navigation/types";
import { LightCard } from "./inventory/components/LightCard";
import { StockStatusBadge, type StockStatus } from "./inventory/components/StockStatusBadge";
import { MiniBarRow } from "./inventory/components/MiniBarRow";
import { QuickAdjustStockSheet } from "./inventory/components/QuickAdjustStockSheet";
import { ProductVariant } from "../services/productVariant.service";
import { VariantChoiceSelection, VariantChoiceSheet } from "./inventory/components/VariantChoiceSheet";
import { hasVariants } from "./inventory/components/variantDomain";
import Svg, { Circle } from "react-native-svg";

const formatINR = (value: number) => {
  const safe = Number.isFinite(value) ? Math.round(value) : 0;
  return `₹${safe.toLocaleString("en-IN")}`;
};

const computeSuggestedRestock = (p: Product) => {
  const min = Number(p.minStockQuantity || 0);
  const onHand = Number(p.availableQuantity || 0);
  if (Number.isFinite(min) && min > 0) {
    const need = Math.max(min - onHand, 0);
    return Math.max(need, 1);
  }
  return 1;
};

type AlertMode = "low_stock" | "out_of_stock";

export const StatsScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, requestLogin } = useAuth();

  const isGuest = user?.role === AppRole.GUEST;
  const hasCompany = Boolean(user?.activeCompany);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<ProductStats | null>(null);
  const [lowStockPreview, setLowStockPreview] = useState<Product[]>([]);
  const [outOfStockPreview, setOutOfStockPreview] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  const [alertMode, setAlertMode] = useState<AlertMode>("low_stock");
  const didUserToggleAlertMode = useRef(false);

  const [adjustSheet, setAdjustSheet] = useState<{
    open: boolean;
    product: Product | null;
    variant: ProductVariant | null;
    suggestedQty: number;
  }>({
    open: false,
    product: null,
    variant: null,
    suggestedQty: 1,
  });
  const [variantChoice, setVariantChoice] = useState<{ visible: boolean; product: Product | null; suggestedQty: number }>({
    visible: false,
    product: null,
    suggestedQty: 1,
  });

  const lowCount = stats?.lowStockCount || 0;
  const outCount = stats?.outOfStockCount || 0;
  const totalItems = stats?.totalItems || 0;
  const totalQty = stats?.totalQuantity || 0;
  const totalValue = stats?.totalCostValue || 0;
  const inStockCount = stats?.statusBreakdown?.in_stock || 0;

  const healthPct = useMemo(() => {
    if (totalItems <= 0) return 0;
    return Math.round((inStockCount / totalItems) * 100);
  }, [inStockCount, totalItems]);

  const healthColor = useMemo(() => {
    if (healthPct >= 85) return colors.success;
    if (healthPct >= 60) return colors.warning;
    return colors.error;
  }, [colors.error, colors.success, colors.warning, healthPct]);

  const fetchAll = useCallback(async () => {
    if (isGuest || !hasCompany) {
      setLoading(false);
      setRefreshing(false);
      setError(null);
      return;
    }

    setError(null);

    const results = await Promise.allSettled([
      productService.getStats(),
      productService.getAll({ scope: "company", status: "low_stock", limit: 5 }),
      productService.getAll({ scope: "company", status: "out_of_stock", limit: 5 }),
      productService.getAll({ scope: "company", limit: 5 }),
    ]);

    const failed: string[] = [];

    const [statsRes, lowRes, outRes, recentRes] = results;
    if (statsRes.status === "fulfilled") {
      setStats(statsRes.value);
    } else {
      failed.push("overview");
      console.warn("[Inventory] stats fetch failed:", statsRes.reason);
    }
    if (lowRes.status === "fulfilled") {
      setLowStockPreview(lowRes.value.products || []);
    } else {
      failed.push("low stock");
      console.warn("[Inventory] low stock fetch failed:", lowRes.reason);
    }
    if (outRes.status === "fulfilled") {
      setOutOfStockPreview(outRes.value.products || []);
    } else {
      failed.push("stockouts");
      console.warn("[Inventory] out of stock fetch failed:", outRes.reason);
    }
    if (recentRes.status === "fulfilled") {
      setRecentProducts(recentRes.value.products || []);
    } else {
      failed.push("recent products");
      console.warn("[Inventory] recent products fetch failed:", recentRes.reason);
    }

    if (failed.length) {
      setError("Some inventory data couldn't be loaded. Pull to refresh or tap retry.");
    }

    setLoading(false);
    setRefreshing(false);
  }, [hasCompany, isGuest]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  useEffect(() => {
    if (didUserToggleAlertMode.current) return;
    const next: AlertMode = outCount > lowCount ? "out_of_stock" : "low_stock";
    setAlertMode(next);
  }, [lowCount, outCount]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, [fetchAll]);

  const openMyProductsSearch = useCallback(() => {
    navigation.navigate("MyProducts", { initialQuery: "" });
  }, [navigation]);

  const openAdjustSheet = useCallback((product: Product, suggestedQty?: number) => {
    const resolvedSuggestedQty = typeof suggestedQty === "number" && suggestedQty > 0 ? suggestedQty : computeSuggestedRestock(product);
    if (hasVariants(product)) {
      setVariantChoice({
        visible: true,
        product,
        suggestedQty: resolvedSuggestedQty,
      });
      return;
    }
    setAdjustSheet({
      open: true,
      product,
      variant: null,
      suggestedQty: resolvedSuggestedQty,
    });
  }, []);

  const closeAdjustSheet = useCallback(() => {
    setAdjustSheet({ open: false, product: null, variant: null, suggestedQty: 1 });
  }, []);

  const closeVariantChoice = useCallback(() => {
    setVariantChoice({ visible: false, product: null, suggestedQty: 1 });
  }, []);

  const handleVariantChoice = useCallback((selection: VariantChoiceSelection) => {
    if (selection.mode === "variant") {
      setAdjustSheet({
        open: true,
        product: selection.product,
        variant: selection.variant,
        suggestedQty: variantChoice.suggestedQty,
      });
    } else {
      setAdjustSheet({
        open: true,
        product: selection.product,
        variant: null,
        suggestedQty: variantChoice.suggestedQty,
      });
    }
    closeVariantChoice();
  }, [closeVariantChoice, variantChoice.suggestedQty]);

  const handleAlertModeChange = useCallback((mode: AlertMode) => {
    didUserToggleAlertMode.current = true;
    setAlertMode(mode);
  }, []);

  const alertItems = alertMode === "low_stock" ? lowStockPreview : outOfStockPreview;
  const alertCount = alertMode === "low_stock" ? lowCount : outCount;

  const openFiltered = useCallback(
    (mode: AlertMode) => {
      navigation.navigate("FilteredProducts", {
        filter: mode,
        title: mode === "low_stock" ? "Low Stock Products" : "Out of Stock Products",
      });
    },
    [navigation]
  );

  const openEditProduct = useCallback(
    (productId: string) => {
      navigation.navigate("EditProduct", { productId });
    },
    [navigation]
  );

  const backgroundOverlay = useMemo(() => ({
    primary: colors.surfaceOverlayPrimary,
    secondary: colors.surfaceOverlaySecondary,
    warm: colors.surfaceOverlayAccent,
  }), [colors.surfaceOverlayAccent, colors.surfaceOverlayPrimary, colors.surfaceOverlaySecondary]);

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Background */}
      <LinearGradient
        colors={[colors.surfaceCanvasStart, colors.surfaceCanvasMid, colors.surfaceCanvasEnd]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[backgroundOverlay.primary, backgroundOverlay.primary.replace("0.12", "0.04"), "transparent"]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["transparent", backgroundOverlay.secondary, "transparent"]}
        locations={[0, 0.55, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.3, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["transparent", "transparent", backgroundOverlay.warm]}
        locations={[0, 0.75, 1]}
        start={{ x: 0.2, y: 0.2 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Sticky top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.topTitle, { color: colors.text }]}>Inventory</Text>
        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={openMyProductsSearch}
            activeOpacity={0.8}
            style={[styles.topIconButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          >
            <Ionicons name="search" size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("AddProduct")}
            activeOpacity={0.85}
            style={[styles.topIconButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
          >
            <Ionicons name="add" size={20} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Guest / company gating */}
      {isGuest ? (
        <View style={[styles.gateWrap, { paddingHorizontal: spacing.lg }]}>
          <LightCard tone="soft" style={{ padding: spacing.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={[styles.gateIcon, { backgroundColor: "rgba(108,99,255,0.12)", borderColor: "rgba(108,99,255,0.20)", borderRadius: radius.lg }]}>
                <Ionicons name="lock-closed" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gateTitle, { color: colors.textOnLightSurface }]}>Sign in to manage inventory</Text>
                <Text style={[styles.gateSubtitle, { color: colors.subtextOnLightSurface }]}>
                  Track stock, fix alerts, and adjust quantities in seconds.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={requestLogin}
              activeOpacity={0.9}
              style={[styles.primaryCta, { backgroundColor: colors.primary, borderRadius: radius.lg, marginTop: spacing.md }]}
            >
              <Ionicons name="log-in-outline" size={18} color={colors.textOnPrimary} />
              <Text style={[styles.primaryCtaText, { color: colors.textOnPrimary }]}>Login</Text>
            </TouchableOpacity>
          </LightCard>
        </View>
      ) : !hasCompany ? (
        <View style={[styles.gateWrap, { paddingHorizontal: spacing.lg }]}>
          <LightCard tone="soft" style={{ padding: spacing.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={[styles.gateIcon, { backgroundColor: "rgba(255,140,60,0.14)", borderColor: "rgba(255,140,60,0.22)", borderRadius: radius.lg }]}>
                <Ionicons name="business" size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gateTitle, { color: colors.textOnLightSurface }]}>Select a company to continue</Text>
                <Text style={[styles.gateSubtitle, { color: colors.subtextOnLightSurface }]}>
                  Inventory data is company-specific. Create a company profile to begin.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("CompanyCreate")}
              activeOpacity={0.9}
              style={[styles.primaryCta, { backgroundColor: colors.primary, borderRadius: radius.lg, marginTop: spacing.md }]}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.textOnPrimary} />
              <Text style={[styles.primaryCtaText, { color: colors.textOnPrimary }]}>Create Company</Text>
            </TouchableOpacity>
          </LightCard>
        </View>
      ) : null}

      {/* Main content */}
      {!isGuest && hasCompany ? (
        loading && !stats && !refreshing ? (
          <View style={[styles.centered, { paddingTop: spacing.xxl }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading inventory…</Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingTop: spacing.lg,
              paddingHorizontal: spacing.lg,
              paddingBottom: spacing.xxl + insets.bottom,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          >
            {/* Today’s priorities */}
            <LightCard style={{ padding: spacing.lg }}>
              <Text style={[styles.cardTitle, { color: colors.textOnLightSurface }]}>Today’s priorities</Text>
              <Text style={[styles.cardSubtitle, { color: colors.subtextOnLightSurface }]}>
                Fix stock alerts first. Then keep catalog clean.
              </Text>

              <View style={[styles.prioritiesRow, { marginTop: spacing.md }]}>
                <View style={styles.healthBlock}>
                  <View style={styles.ringWrap}>
                    <RingGauge value={healthPct} size={72} strokeWidth={7} color={healthColor} />
                    <View style={styles.ringCenter}>
                      <Text style={[styles.ringValue, { color: colors.textOnLightSurface }]}>{healthPct}%</Text>
                      <Text style={[styles.ringLabel, { color: colors.subtextOnLightSurface }]}>Health</Text>
                    </View>
                  </View>
                  <Text style={[styles.healthTitle, { color: colors.textOnLightSurface }]}>Inventory health</Text>
                  <Text style={[styles.healthHint, { color: colors.subtextOnLightSurface }]}>In-stock coverage</Text>
                </View>

                <View style={styles.counterCol}>
                  <CounterButton
                    label="Stockouts"
                    value={outCount}
                    color={colors.errorStrong || colors.error}
                    icon="alert-circle"
                    onPress={() => openFiltered("out_of_stock")}
                  />
                  <CounterButton
                    label="Low stock"
                    value={lowCount}
                    color={colors.warningStrong || colors.warning}
                    icon="warning"
                    onPress={() => openFiltered("low_stock")}
                  />
                </View>
              </View>

              <View style={[styles.ctaRow, { marginTop: spacing.md }]}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate("MyProducts")}
                  style={[styles.secondaryCta, { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surfaceLightSoft }]}
                >
                  <Ionicons name="list" size={18} color={colors.textOnLightSurface} />
                  <Text style={[styles.secondaryCtaText, { color: colors.textOnLightSurface }]}>View all products</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate("AddProduct")}
                  style={[styles.primaryCta, { backgroundColor: colors.primary, borderRadius: radius.lg }]}
                >
                  <Ionicons name="add" size={18} color={colors.textOnPrimary} />
                  <Text style={[styles.primaryCtaText, { color: colors.textOnPrimary }]}>Add product</Text>
                </TouchableOpacity>
              </View>
            </LightCard>

            {/* Error banner */}
            {error ? (
              <LightCard tone="soft" style={{ marginTop: spacing.md, padding: spacing.md }}>
                <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                  <Ionicons name="information-circle" size={18} color={colors.primary} />
                  <Text style={[styles.errorText, { color: colors.textOnLightSurface, flex: 1 }]}>{error}</Text>
                  <TouchableOpacity onPress={fetchAll} activeOpacity={0.85}>
                    <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
                  </TouchableOpacity>
                </View>
              </LightCard>
            ) : null}

            {/* Alerts queue */}
            <LightCard style={{ marginTop: spacing.md, padding: spacing.lg }}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.textOnLightSurface }]}>Alerts queue</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.subtextOnLightSurface }]}>Restock the few items that drive most issues.</Text>
                </View>
                <View style={[styles.segment, { borderRadius: radius.pill, borderColor: colors.border, backgroundColor: colors.surfaceLightSoft }]}>
                  <SegmentOption
                    active={alertMode === "low_stock"}
                    label="Low stock"
                    onPress={() => handleAlertModeChange("low_stock")}
                  />
                  <SegmentOption
                    active={alertMode === "out_of_stock"}
                    label="Stockouts"
                    onPress={() => handleAlertModeChange("out_of_stock")}
                  />
                </View>
              </View>

              {alertCount <= 0 ? (
                <View style={[styles.emptyAlerts, { borderRadius: radius.lg, borderColor: colors.border }]}>
                  <View style={[styles.emptyIconWrap, { backgroundColor: "rgba(74,222,128,0.16)", borderRadius: radius.lg }]}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.emptyTitle, { color: colors.textOnLightSurface }]}>All good</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.subtextOnLightSurface }]}>
                      No {alertMode === "low_stock" ? "low stock" : "stockout"} alerts right now.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={{ marginTop: spacing.md }}>
                  {alertItems.map((p, idx) => {
                    const onHand = Number(p.availableQuantity || 0);
                    const min = Number(p.minStockQuantity || 0);
                    const need = Math.max(min - onHand, 0);
                    const status: StockStatus = onHand <= 0 ? "out_of_stock" : onHand <= min ? "low_stock" : "in_stock";

                    return (
                      <View
                        key={p._id}
                        style={[
                          styles.alertRowWrap,
                          { borderBottomColor: colors.border },
                          idx === alertItems.length - 1 && { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 },
                        ]}
                      >
                        <TouchableOpacity activeOpacity={0.85} onPress={() => openEditProduct(p._id)} style={styles.alertRow}>
                          <View style={{ flex: 1, gap: 6 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                              <Text style={[styles.alertName, { color: colors.textOnLightSurface }]} numberOfLines={1}>
                                {p.name}
                              </Text>
                              <StockStatusBadge status={status} size="sm" />
                            </View>
                            {p.sku ? (
                              <Text style={[styles.alertSku, { color: colors.subtextOnLightSurface }]} numberOfLines={1}>
                                SKU: {p.sku}
                              </Text>
                            ) : null}

                            <View style={styles.metricsRow}>
                              <Metric label="On hand" value={onHand} />
                              <Metric label="Min" value={min} />
                              <Metric label="Need" value={need} highlight />
                            </View>
                          </View>

                          <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => openAdjustSheet(p, computeSuggestedRestock(p))}
                            style={[
                              styles.addStockButton,
                              {
                                backgroundColor: "rgba(108,99,255,0.10)",
                                borderColor: "rgba(108,99,255,0.22)",
                                borderRadius: radius.lg,
                              },
                            ]}
                          >
                            <Ionicons name="add" size={16} color={colors.primary} />
                            <Text style={[styles.addStockText, { color: colors.primary }]}>Add stock</Text>
                          </TouchableOpacity>
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                  <TouchableOpacity
                    onPress={() => openFiltered(alertMode)}
                    activeOpacity={0.9}
                    style={[
                      styles.viewAllRow,
                      { marginTop: spacing.md, borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surfaceLightSoft },
                    ]}
                  >
                    <Text style={[styles.viewAllText, { color: colors.textOnLightSurface }]}>
                      View all {alertMode === "low_stock" ? "low stock" : "stockout"} items
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.subtextOnLightSurface} />
                  </TouchableOpacity>
                </View>
              )}
            </LightCard>

            {/* KPI overview */}
            <LightCard style={{ marginTop: spacing.md, padding: spacing.lg }}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.textOnLightSurface }]}>Inventory overview</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.subtextOnLightSurface }]}>A compact snapshot for daily ops.</Text>
                </View>
              </View>

              <View style={[styles.kpiGrid, { marginTop: spacing.md }]}>
                <KPIBlock title="Total SKUs" value={totalItems.toLocaleString("en-IN")} icon="cube" />
                <KPIBlock title="Total units" value={totalQty.toLocaleString("en-IN")} icon="layers" />
                <KPIBlock title="Stock value" value={formatINR(totalValue)} icon="cash" />
                <KPIBlock
                  title="At-risk SKUs"
                  value={`${(lowCount + outCount).toLocaleString("en-IN")} (${totalItems ? Math.round(((lowCount + outCount) / totalItems) * 100) : 0}%)`}
                  icon="flame"
                  tone="warning"
                />
              </View>
            </LightCard>

            {/* Category hotspots */}
            <LightCard style={{ marginTop: spacing.md, padding: spacing.lg }}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.textOnLightSurface }]}>Category hotspots</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.subtextOnLightSurface }]}>Where most of your on-hand quantity sits.</Text>
                </View>
              </View>

              {stats?.categoryDistribution?.length ? (
                (() => {
                  const sorted = [...stats.categoryDistribution]
                    .filter((c) => (c.totalQuantity || 0) > 0 || (c.count || 0) > 0)
                    .sort((a, b) => (b.totalQuantity || 0) - (a.totalQuantity || 0))
                    .slice(0, 5);
                  const max = Math.max(1, ...sorted.map((s) => Number(s.totalQuantity || 0)));

                  if (!sorted.length) {
                    return (
                      <View style={[styles.emptyInline, { borderRadius: radius.lg, borderColor: colors.border }]}>
                        <Ionicons name="stats-chart" size={16} color={colors.subtextOnLightSurface} />
                        <Text style={[styles.emptyInlineText, { color: colors.subtextOnLightSurface }]}>
                          Add products and stock to unlock category insights.
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <View style={{ marginTop: spacing.md }}>
                      {sorted.map((c) => (
                        <MiniBarRow
                          key={c.id}
                          label={c.label}
                          value={Number(c.totalQuantity || 0)}
                          max={max}
                          color={colors.primary}
                          valueLabel={`${Number(c.totalQuantity || 0).toLocaleString("en-IN")} units`}
                        />
                      ))}
                    </View>
                  );
                })()
              ) : (
                <View style={[styles.emptyInline, { borderRadius: radius.lg, borderColor: colors.border }]}>
                  <Ionicons name="stats-chart" size={16} color={colors.subtextOnLightSurface} />
                  <Text style={[styles.emptyInlineText, { color: colors.subtextOnLightSurface }]}>
                    No category data yet.
                  </Text>
                </View>
              )}
            </LightCard>

            {/* Recent products */}
            <LightCard style={{ marginTop: spacing.md, padding: spacing.lg }}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.textOnLightSurface }]}>Recent products</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.subtextOnLightSurface }]}>Fast adjustments without digging through the catalog.</Text>
                </View>
              </View>

              {recentProducts.length ? (
                <View style={{ marginTop: spacing.md }}>
                  {recentProducts.map((p, idx) => {
                    const onHand = Number(p.availableQuantity || 0);
                    const min = Number(p.minStockQuantity || 0);
                    const status: StockStatus = onHand <= 0 ? "out_of_stock" : onHand <= min ? "low_stock" : "in_stock";

                    return (
                      <View
                        key={p._id}
                        style={[
                          styles.recentRowWrap,
                          { borderBottomColor: colors.border },
                          idx === recentProducts.length - 1 && { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 },
                        ]}
                      >
                        <TouchableOpacity activeOpacity={0.85} onPress={() => openEditProduct(p._id)} style={styles.recentRow}>
                          <View style={{ flex: 1, gap: 6 }}>
                            <Text style={[styles.recentName, { color: colors.textOnLightSurface }]} numberOfLines={1}>
                              {p.name}
                            </Text>
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                              <Text style={[styles.recentMeta, { color: colors.subtextOnLightSurface }]}>
                                {onHand.toLocaleString("en-IN")} units
                              </Text>
                              <StockStatusBadge status={status} size="sm" />
                            </View>
                          </View>

                          <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => openAdjustSheet(p, 1)}
                            style={[
                              styles.adjustButton,
                              { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surfaceLightSoft },
                            ]}
                          >
                            <Ionicons name="swap-vertical" size={16} color={colors.subtextOnLightSurface} />
                            <Text style={[styles.adjustText, { color: colors.textOnLightSurface }]}>Adjust</Text>
                          </TouchableOpacity>
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                  <TouchableOpacity
                    onPress={() => navigation.navigate("MyProducts")}
                    activeOpacity={0.9}
                    style={[
                      styles.viewAllRow,
                      { marginTop: spacing.md, borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surfaceLightSoft },
                    ]}
                  >
                    <Text style={[styles.viewAllText, { color: colors.textOnLightSurface }]}>View all products</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.subtextOnLightSurface} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.emptyInline, { borderRadius: radius.lg, borderColor: colors.border }]}>
                  <Ionicons name="cube-outline" size={16} color={colors.subtextOnLightSurface} />
                  <Text style={[styles.emptyInlineText, { color: colors.subtextOnLightSurface }]}>
                    No recent products found.
                  </Text>
                </View>
              )}
            </LightCard>
          </ScrollView>
        )
      ) : null}

      {/* Adjust sheet */}
      <QuickAdjustStockSheet
        visible={adjustSheet.open}
        product={adjustSheet.product}
        variant={adjustSheet.variant}
        suggestedQty={adjustSheet.suggestedQty}
        onClose={closeAdjustSheet}
        onSaved={fetchAll}
      />

      <VariantChoiceSheet
        visible={variantChoice.visible}
        product={variantChoice.product}
        scope="company"
        title="Quick adjust stock"
        subtitle="This product has variants. Choose what stock you want to adjust."
        baseActionLabel="Adjust base product stock"
        onClose={closeVariantChoice}
        onSelect={async (selection) => {
          handleVariantChoice(selection);
        }}
      />
    </SafeAreaView>
  );
};

const CounterButton = ({
  label,
  value,
  color,
  icon,
  onPress,
}: {
  label: string;
  value: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) => {
  const { colors, radius } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.counterCard,
        {
          borderRadius: radius.lg,
          borderColor: `${color}26`,
          backgroundColor: `${color}10`,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Ionicons name={icon} size={16} color={color} />
        <Ionicons name="chevron-forward" size={16} color={colors.subtextOnLightSurface} />
      </View>
      <Text style={[styles.counterValue, { color }]}>{Number(value || 0).toLocaleString("en-IN")}</Text>
      <Text style={[styles.counterLabel, { color: colors.subtextOnLightSurface }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const RingGauge = ({
  value,
  size = 72,
  strokeWidth = 7,
  color,
  trackColor,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor?: string;
}) => {
  const { colors } = useTheme();
  const resolvedTrackColor = trackColor || colors.border;
  const safe = Number.isFinite(value) ? value : 0;
  const pct = Math.max(0, Math.min(1, safe / 100));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const dashOffset = c * (1 - pct);

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={resolvedTrackColor} strokeWidth={strokeWidth} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={dashOffset}
        fill="none"
      />
    </Svg>
  );
};

const SegmentOption = ({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) => {
  const { colors, radius } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.segmentOption,
        {
          backgroundColor: active ? colors.surface : "transparent",
          borderRadius: radius.pill,
          borderColor: active ? colors.border : "transparent",
        },
      ]}
    >
      <Text style={[styles.segmentText, { color: active ? colors.textOnLightSurface : colors.subtextOnLightSurface }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const Metric = ({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) => {
  const { colors, radius } = useTheme();
  return (
    <View style={[styles.metric, { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surfaceLightSoft }]}>
      <Text style={[styles.metricLabel, { color: colors.subtextOnLightSurface }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: highlight ? colors.primary : colors.textOnLightSurface }]}>
        {Number(value || 0).toLocaleString("en-IN")}
      </Text>
    </View>
  );
};

const KPIBlock = ({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: "warning";
}) => {
  const { colors, radius } = useTheme();
  const accent = tone === "warning" ? (colors.warningStrong || colors.warning) : colors.primary;
  return (
    <View
      style={[
        styles.kpiCell,
        {
          borderRadius: radius.lg,
          borderColor: colors.border,
          backgroundColor: colors.surfaceLightSoft,
          shadowColor: colors.cardShadow,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 1,
          shadowRadius: 18,
          elevation: 6,
        },
      ]}
    >
      <View style={styles.kpiTop}>
        <Text style={[styles.kpiTitle, { color: colors.subtextOnLightSurface }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={[styles.kpiIcon, { backgroundColor: `${accent}12`, borderColor: `${accent}22`, borderRadius: radius.lg }]}>
          <Ionicons name={icon} size={16} color={accent} />
        </View>
      </View>
      <Text style={[styles.kpiValue, { color: colors.textOnLightSurface }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  topTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -0.3 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  topIconButton: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },

  gateWrap: { paddingTop: 14 },
  gateIcon: { width: 40, height: 40, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  gateTitle: { fontSize: 16, fontWeight: "900" },
  gateSubtitle: { marginTop: 3, fontSize: 12, fontWeight: "700", lineHeight: 16 },

  centered: { alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 10, fontSize: 13, fontWeight: "700" },

  cardTitle: { fontSize: 16, fontWeight: "900", letterSpacing: -0.2 },
  cardSubtitle: { marginTop: 4, fontSize: 12, fontWeight: "700" },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12 },

  prioritiesRow: { flexDirection: "row", gap: 14 },
  healthBlock: { width: 140 },
  ringWrap: { width: 72, height: 72, alignItems: "center", justifyContent: "center" },
  ringCenter: { position: "absolute", alignItems: "center", justifyContent: "center" },
  ringValue: { fontSize: 14, fontWeight: "900" },
  ringLabel: { marginTop: 1, fontSize: 10, fontWeight: "800" },
  healthTitle: { marginTop: 10, fontSize: 13, fontWeight: "900" },
  healthHint: { marginTop: 2, fontSize: 11, fontWeight: "700" },

  counterCol: { flex: 1, gap: 10 },
  counterCard: { padding: 12, borderWidth: 1 },
  counterValue: { marginTop: 10, fontSize: 18, fontWeight: "900" },
  counterLabel: { marginTop: 2, fontSize: 12, fontWeight: "800" },

  ctaRow: { flexDirection: "row", gap: 10 },
  primaryCta: { flex: 1, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryCtaText: { fontSize: 13, fontWeight: "900" },
  secondaryCta: { flex: 1, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1 },
  secondaryCtaText: { fontSize: 13, fontWeight: "900" },

  errorText: { fontSize: 12, fontWeight: "800" },
  retryText: { fontSize: 12, fontWeight: "900" },

  segment: { flexDirection: "row", padding: 6, borderWidth: 1 },
  segmentOption: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1 },
  segmentText: { fontSize: 11, fontWeight: "900" },

  emptyAlerts: { marginTop: 14, padding: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  emptyIconWrap: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 13, fontWeight: "900" },
  emptySubtitle: { marginTop: 2, fontSize: 12, fontWeight: "700" },

  alertRowWrap: { borderBottomWidth: 1, paddingBottom: 14, marginBottom: 14 },
  alertRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  alertName: { fontSize: 13, fontWeight: "900" },
  alertSku: { fontSize: 11, fontWeight: "700" },

  metricsRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  metric: { flex: 1, padding: 10, borderWidth: 1 },
  metricLabel: { fontSize: 10, fontWeight: "900" },
  metricValue: { marginTop: 3, fontSize: 13, fontWeight: "900" },

  addStockButton: { height: 40, paddingHorizontal: 12, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  addStockText: { fontSize: 12, fontWeight: "900" },

  viewAllRow: { height: 46, borderWidth: 1, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  viewAllText: { fontSize: 12, fontWeight: "900" },

  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  kpiCell: { width: "48%", padding: 12, borderWidth: 1 },
  kpiTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  kpiTitle: { fontSize: 11, fontWeight: "900", flex: 1 },
  kpiIcon: { width: 32, height: 32, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  kpiValue: { marginTop: 10, fontSize: 14, fontWeight: "900" },

  emptyInline: { marginTop: 14, padding: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  emptyInlineText: { fontSize: 12, fontWeight: "800", flex: 1 },

  recentRowWrap: { borderBottomWidth: 1, paddingBottom: 14, marginBottom: 14 },
  recentRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  recentName: { fontSize: 13, fontWeight: "900" },
  recentMeta: { fontSize: 11, fontWeight: "800" },
  adjustButton: { height: 40, paddingHorizontal: 12, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  adjustText: { fontSize: 12, fontWeight: "900" },
});
