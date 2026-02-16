import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../hooks/useTheme";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
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
import { AdaptiveSingleLineText } from "../components/text/AdaptiveSingleLineText";
import { AdaptiveTwoLineText } from "../components/text/AdaptiveTwoLineText";
import { useInventoryDashboardLayout } from "./inventory/components/inventoryDashboard.layout";
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
  const { isXCompact, isCompact, contentPadding } = useResponsiveLayout();
  const layout = useInventoryDashboardLayout();
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

  const cardPadding = layout.cardPadding;
  const topHorizontalPadding = isXCompact ? contentPadding : spacing.lg;

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
      <View
        style={[
          styles.topBar,
          {
            minHeight: layout.headerHeight,
            paddingTop: insets.top + spacing.sm,
            paddingBottom: spacing.sm,
            paddingHorizontal: topHorizontalPadding,
          },
        ]}
      >
        <AdaptiveSingleLineText
          allowOverflowScroll={false}
          style={[styles.topTitle, { color: colors.text, fontSize: layout.titleSize }]}
        >
          Inventory
        </AdaptiveSingleLineText>
        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={openMyProductsSearch}
            activeOpacity={0.8}
            style={[
              styles.topIconButton,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                width: layout.iconButtonSize,
                height: layout.iconButtonSize,
                borderRadius: layout.compact ? 10 : 12,
              },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("AddProduct")}
            activeOpacity={0.85}
            style={[
              styles.topIconButton,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
                width: layout.iconButtonSize,
                height: layout.iconButtonSize,
                borderRadius: layout.compact ? 10 : 12,
              },
            ]}
          >
            <Ionicons name="add" size={20} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Guest / company gating */}
      {isGuest ? (
        <View style={[styles.gateWrap, { paddingHorizontal: topHorizontalPadding }]}>
          <LightCard tone="soft" style={{ padding: cardPadding }}>
            <View style={[styles.gateRow, isCompact && styles.gateRowStack]}>
              <View style={[styles.gateIcon, { backgroundColor: "rgba(108,99,255,0.12)", borderColor: "rgba(108,99,255,0.20)", borderRadius: radius.lg }]}>
                <Ionicons name="lock-closed" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.gateTitle, { color: colors.textOnLightSurface }]}>
                  Sign in to manage inventory
                </AdaptiveSingleLineText>
                <AdaptiveTwoLineText minimumFontScale={0.72} style={[styles.gateSubtitle, { color: colors.subtextOnLightSurface }]}>
                  Track stock, fix alerts, and adjust quantities in seconds.
                </AdaptiveTwoLineText>
              </View>
            </View>

            <TouchableOpacity
              onPress={requestLogin}
              activeOpacity={0.9}
              style={[
                styles.primaryCta,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radius.lg,
                  marginTop: spacing.md,
                  minHeight: layout.ctaHeight,
                },
              ]}
            >
              <Ionicons name="log-in-outline" size={18} color={colors.textOnPrimary} />
              <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.primaryCtaText, { color: colors.textOnPrimary }]}>
                Login
              </AdaptiveSingleLineText>
            </TouchableOpacity>
          </LightCard>
        </View>
      ) : !hasCompany ? (
        <View style={[styles.gateWrap, { paddingHorizontal: topHorizontalPadding }]}>
          <LightCard tone="soft" style={{ padding: cardPadding }}>
            <View style={[styles.gateRow, isCompact && styles.gateRowStack]}>
              <View style={[styles.gateIcon, { backgroundColor: "rgba(255,140,60,0.14)", borderColor: "rgba(255,140,60,0.22)", borderRadius: radius.lg }]}>
                <Ionicons name="business" size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.gateTitle, { color: colors.textOnLightSurface }]}>
                  Select a company to continue
                </AdaptiveSingleLineText>
                <AdaptiveTwoLineText minimumFontScale={0.72} style={[styles.gateSubtitle, { color: colors.subtextOnLightSurface }]}>
                  Inventory data is company-specific. Create a company profile to begin.
                </AdaptiveTwoLineText>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("CompanyCreate")}
              activeOpacity={0.9}
              style={[
                styles.primaryCta,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radius.lg,
                  marginTop: spacing.md,
                  minHeight: layout.ctaHeight,
                },
              ]}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.textOnPrimary} />
              <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.primaryCtaText, { color: colors.textOnPrimary }]}>
                Create Company
              </AdaptiveSingleLineText>
            </TouchableOpacity>
          </LightCard>
        </View>
      ) : null}

      {/* Main content */}
      {!isGuest && hasCompany ? (
        loading && !stats && !refreshing ? (
          <View style={[styles.centered, { paddingTop: spacing.xxl }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.loadingText, { color: colors.textMuted }]}>
              Loading inventory…
            </AdaptiveSingleLineText>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingTop: spacing.lg,
              paddingHorizontal: topHorizontalPadding,
              paddingBottom: spacing.xxl + insets.bottom,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          >
            {/* Today’s priorities */}
            <LightCard style={{ padding: cardPadding }}>
              <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.cardTitle, { color: colors.textOnLightSurface }]}>
                Today’s priorities
              </AdaptiveSingleLineText>
              <AdaptiveTwoLineText minimumFontScale={0.72} style={[styles.cardSubtitle, { color: colors.subtextOnLightSurface }]}>
                Fix stock alerts first. Then keep catalog clean.
              </AdaptiveTwoLineText>

              <View style={[styles.prioritiesRow, isCompact && styles.prioritiesRowStack, { marginTop: spacing.md }]}>
                <View style={[styles.healthBlock, isCompact && styles.healthBlockStack]}>
                  <View style={styles.ringWrap}>
                    <RingGauge value={healthPct} size={72} strokeWidth={7} color={healthColor} />
                    <View style={styles.ringCenter}>
                      <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.ringValue, { color: colors.textOnLightSurface }]}>
                        {healthPct}%
                      </AdaptiveSingleLineText>
                      <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.ringLabel, { color: colors.subtextOnLightSurface }]}>
                        Health
                      </AdaptiveSingleLineText>
                    </View>
                  </View>
                  <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.healthTitle, { color: colors.textOnLightSurface }]}>
                    Inventory health
                  </AdaptiveSingleLineText>
                  <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.healthHint, { color: colors.subtextOnLightSurface }]}>
                    In-stock coverage
                  </AdaptiveSingleLineText>
                </View>

                <View style={[styles.counterCol, isCompact && styles.counterColStack]}>
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

              <View style={[styles.ctaRow, isCompact && styles.ctaRowStack, { marginTop: spacing.md }]}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate("MyProducts")}
                  style={[
                    styles.secondaryCta,
                    {
                      borderRadius: radius.lg,
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceLightSoft,
                      minHeight: layout.ctaHeight,
                    },
                  ]}
                >
                  <Ionicons name="list" size={18} color={colors.textOnLightSurface} />
                  <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.secondaryCtaText, { color: colors.textOnLightSurface }]}>
                    View all products
                  </AdaptiveSingleLineText>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate("AddProduct")}
                  style={[
                    styles.primaryCta,
                    { backgroundColor: colors.primary, borderRadius: radius.lg, minHeight: layout.ctaHeight },
                  ]}
                >
                  <Ionicons name="add" size={18} color={colors.textOnPrimary} />
                  <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.primaryCtaText, { color: colors.textOnPrimary }]}>
                    Add product
                  </AdaptiveSingleLineText>
                </TouchableOpacity>
              </View>
            </LightCard>

            {/* Error banner */}
            {error ? (
            <LightCard tone="soft" style={{ marginTop: spacing.md, padding: cardPadding }}>
                <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                  <Ionicons name="information-circle" size={18} color={colors.primary} />
                  <AdaptiveTwoLineText
                    minimumFontScale={0.72}
                    style={[styles.errorText, { color: colors.textOnLightSurface, flex: 1 }]}
                  >
                    {error}
                  </AdaptiveTwoLineText>
                  <TouchableOpacity onPress={fetchAll} activeOpacity={0.85}>
                    <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.retryText, { color: colors.primary }]}>
                      Retry
                    </AdaptiveSingleLineText>
                  </TouchableOpacity>
                </View>
              </LightCard>
            ) : null}

            {/* Alerts queue */}
            <LightCard style={{ marginTop: spacing.md, padding: cardPadding }}>
              <View style={[styles.cardHeaderRow, isCompact && styles.cardHeaderRowStack]}>
                <View style={{ flex: 1 }}>
                  <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.cardTitle, { color: colors.textOnLightSurface }]}>
                    Alerts queue
                  </AdaptiveSingleLineText>
                  <AdaptiveTwoLineText minimumFontScale={0.72} style={[styles.cardSubtitle, { color: colors.subtextOnLightSurface }]}>
                    Restock the few items that drive most issues.
                  </AdaptiveTwoLineText>
                </View>
                <View
                  style={[
                    styles.segment,
                    isCompact && styles.segmentStack,
                    { borderRadius: radius.pill, borderColor: colors.border, backgroundColor: colors.surfaceLightSoft },
                  ]}
                >
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
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.emptyTitle, { color: colors.textOnLightSurface }]}>
                      All good
                    </AdaptiveSingleLineText>
                    <AdaptiveTwoLineText minimumFontScale={0.72} style={[styles.emptySubtitle, { color: colors.subtextOnLightSurface }]}>
                      No {alertMode === "low_stock" ? "low stock" : "stockout"} alerts right now.
                    </AdaptiveTwoLineText>
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
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => openEditProduct(p._id)}
                          style={[styles.alertRow, isCompact && styles.listRowStack]}
                        >
                          <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, minWidth: 0 }}>
                              <AdaptiveSingleLineText
                                minimumFontScale={0.72}
                                style={[styles.alertName, { color: colors.textOnLightSurface, flex: 1 }]}
                              >
                                {p.name}
                              </AdaptiveSingleLineText>
                              <StockStatusBadge status={status} size="sm" />
                            </View>
                            {p.sku ? (
                              <AdaptiveSingleLineText
                                minimumFontScale={0.72}
                                style={[styles.alertSku, { color: colors.subtextOnLightSurface }]}
                              >
                                SKU: {p.sku}
                              </AdaptiveSingleLineText>
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
                              isCompact && styles.rowActionButtonCompact,
                              {
                                backgroundColor: "rgba(108,99,255,0.10)",
                                borderColor: "rgba(108,99,255,0.22)",
                                borderRadius: radius.lg,
                              },
                            ]}
                          >
                            <Ionicons name="add" size={16} color={colors.primary} />
                            <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.addStockText, { color: colors.primary }]}>
                              Add stock
                            </AdaptiveSingleLineText>
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
                      {
                        marginTop: spacing.md,
                        borderRadius: radius.lg,
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceLightSoft,
                        minHeight: layout.ctaHeight,
                      },
                    ]}
                  >
                    <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.viewAllText, { color: colors.textOnLightSurface }]}>
                      View all {alertMode === "low_stock" ? "low stock" : "stockout"} items
                    </AdaptiveSingleLineText>
                    <Ionicons name="chevron-forward" size={18} color={colors.subtextOnLightSurface} />
                  </TouchableOpacity>
                </View>
              )}
            </LightCard>

            {/* KPI overview */}
            <LightCard style={{ marginTop: spacing.md, padding: cardPadding }}>
              <View style={[styles.cardHeaderRow, isCompact && styles.cardHeaderRowStack]}>
                <View style={{ flex: 1 }}>
                  <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.cardTitle, { color: colors.textOnLightSurface }]}>
                    Inventory overview
                  </AdaptiveSingleLineText>
                  <AdaptiveTwoLineText minimumFontScale={0.72} style={[styles.cardSubtitle, { color: colors.subtextOnLightSurface }]}>
                    A compact snapshot for daily ops.
                  </AdaptiveTwoLineText>
                </View>
              </View>

              <View style={[styles.kpiGrid, isCompact && styles.kpiGridStack, { marginTop: spacing.md }]}>
                <KPIBlock title="Total SKUs" value={totalItems.toLocaleString("en-IN")} icon="cube" singleColumn={isCompact} />
                <KPIBlock title="Total units" value={totalQty.toLocaleString("en-IN")} icon="layers" singleColumn={isCompact} />
                <KPIBlock title="Stock value" value={formatINR(totalValue)} icon="cash" singleColumn={isCompact} />
                <KPIBlock
                  title="At-risk SKUs"
                  value={`${(lowCount + outCount).toLocaleString("en-IN")} (${totalItems ? Math.round(((lowCount + outCount) / totalItems) * 100) : 0}%)`}
                  icon="flame"
                  tone="warning"
                  singleColumn={isCompact}
                />
              </View>
            </LightCard>

            {/* Category hotspots */}
            <LightCard style={{ marginTop: spacing.md, padding: cardPadding }}>
              <View style={[styles.cardHeaderRow, isCompact && styles.cardHeaderRowStack]}>
                <View style={{ flex: 1 }}>
                  <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.cardTitle, { color: colors.textOnLightSurface }]}>
                    Category hotspots
                  </AdaptiveSingleLineText>
                  <AdaptiveTwoLineText minimumFontScale={0.72} style={[styles.cardSubtitle, { color: colors.subtextOnLightSurface }]}>
                    Where most of your on-hand quantity sits.
                  </AdaptiveTwoLineText>
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
                        <AdaptiveTwoLineText minimumFontScale={0.72} style={[styles.emptyInlineText, { color: colors.subtextOnLightSurface }]}>
                          Add products and stock to unlock category insights.
                        </AdaptiveTwoLineText>
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
                  <AdaptiveTwoLineText minimumFontScale={0.72} style={[styles.emptyInlineText, { color: colors.subtextOnLightSurface }]}>
                    No category data yet.
                  </AdaptiveTwoLineText>
                </View>
              )}
            </LightCard>

            {/* Recent products */}
            <LightCard style={{ marginTop: spacing.md, padding: cardPadding }}>
              <View style={[styles.cardHeaderRow, isCompact && styles.cardHeaderRowStack]}>
                <View style={{ flex: 1 }}>
                  <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.cardTitle, { color: colors.textOnLightSurface }]}>
                    Recent products
                  </AdaptiveSingleLineText>
                  <AdaptiveTwoLineText minimumFontScale={0.72} style={[styles.cardSubtitle, { color: colors.subtextOnLightSurface }]}>
                    Fast adjustments without digging through the catalog.
                  </AdaptiveTwoLineText>
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
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => openEditProduct(p._id)}
                          style={[styles.recentRow, isCompact && styles.listRowStack]}
                        >
                          <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
                            <AdaptiveSingleLineText
                              minimumFontScale={0.72}
                              style={[styles.recentName, { color: colors.textOnLightSurface }]}
                            >
                              {p.name}
                            </AdaptiveSingleLineText>
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, minWidth: 0 }}>
                              <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.recentMeta, { color: colors.subtextOnLightSurface }]}>
                                {onHand.toLocaleString("en-IN")} units
                              </AdaptiveSingleLineText>
                              <StockStatusBadge status={status} size="sm" />
                            </View>
                          </View>

                          <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => openAdjustSheet(p, 1)}
                            style={[
                              styles.adjustButton,
                              isCompact && styles.rowActionButtonCompact,
                              { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surfaceLightSoft },
                            ]}
                          >
                            <Ionicons name="swap-vertical" size={16} color={colors.subtextOnLightSurface} />
                            <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.adjustText, { color: colors.textOnLightSurface }]}>
                              Adjust
                            </AdaptiveSingleLineText>
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
                      {
                        marginTop: spacing.md,
                        borderRadius: radius.lg,
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceLightSoft,
                        minHeight: layout.ctaHeight,
                      },
                    ]}
                  >
                    <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.viewAllText, { color: colors.textOnLightSurface }]}>
                      View all products
                    </AdaptiveSingleLineText>
                    <Ionicons name="chevron-forward" size={18} color={colors.subtextOnLightSurface} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.emptyInline, { borderRadius: radius.lg, borderColor: colors.border }]}>
                  <Ionicons name="cube-outline" size={16} color={colors.subtextOnLightSurface} />
                  <AdaptiveTwoLineText minimumFontScale={0.72} style={[styles.emptyInlineText, { color: colors.subtextOnLightSurface }]}>
                    No recent products found.
                  </AdaptiveTwoLineText>
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
  const layout = useInventoryDashboardLayout();
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
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, minWidth: 0 }}>
        <Ionicons name={icon} size={16} color={color} />
        <Ionicons name="chevron-forward" size={16} color={colors.subtextOnLightSurface} />
      </View>
      <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.counterValue, { color, fontSize: layout.compact ? 16 : 18 }]}>
        {Number(value || 0).toLocaleString("en-IN")}
      </AdaptiveSingleLineText>
      <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.counterLabel, { color: colors.subtextOnLightSurface }]}>
        {label}
      </AdaptiveSingleLineText>
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
  const layout = useInventoryDashboardLayout();
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
          minHeight: layout.chipHeight,
          paddingHorizontal: layout.compact ? 10 : 12,
        },
      ]}
    >
      <AdaptiveSingleLineText
        allowOverflowScroll={false}
        minimumFontScale={0.74}
        style={[styles.segmentText, { color: active ? colors.textOnLightSurface : colors.subtextOnLightSurface }]}
      >
        {label}
      </AdaptiveSingleLineText>
    </TouchableOpacity>
  );
};

const Metric = ({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) => {
  const { colors, radius } = useTheme();
  const layout = useInventoryDashboardLayout();
  return (
    <View style={[styles.metric, { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surfaceLightSoft }]}>
      <AdaptiveSingleLineText
        allowOverflowScroll={false}
        style={[styles.metricLabel, { color: colors.subtextOnLightSurface, fontSize: layout.compact ? 9 : 10 }]}
      >
        {label}
      </AdaptiveSingleLineText>
      <AdaptiveSingleLineText
        allowOverflowScroll={false}
        style={[styles.metricValue, { color: highlight ? colors.primary : colors.textOnLightSurface, fontSize: layout.compact ? 12 : 13 }]}
      >
        {Number(value || 0).toLocaleString("en-IN")}
      </AdaptiveSingleLineText>
    </View>
  );
};

const KPIBlock = ({
  title,
  value,
  icon,
  tone,
  singleColumn,
}: {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: "warning";
  singleColumn?: boolean;
}) => {
  const { colors, radius } = useTheme();
  const accent = tone === "warning" ? (colors.warningStrong || colors.warning) : colors.primary;
  return (
    <View
      style={[
        styles.kpiCell,
        singleColumn ? styles.kpiCellSingle : null,
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
        <AdaptiveSingleLineText
          minimumFontScale={0.72}
          style={[styles.kpiTitle, { color: colors.subtextOnLightSurface }]}
        >
          {title}
        </AdaptiveSingleLineText>
        <View style={[styles.kpiIcon, { backgroundColor: `${accent}12`, borderColor: `${accent}22`, borderRadius: radius.lg }]}>
          <Ionicons name={icon} size={16} color={accent} />
        </View>
      </View>
      <AdaptiveSingleLineText
        minimumFontScale={0.68}
        style={[styles.kpiValue, { color: colors.textOnLightSurface }]}
      >
        {value}
      </AdaptiveSingleLineText>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  topTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -0.3, minWidth: 0, flexShrink: 1 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  topIconButton: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },

  gateWrap: { paddingTop: 14 },
  gateRow: { flexDirection: "row", alignItems: "center", gap: 12, minWidth: 0 },
  gateRowStack: { alignItems: "flex-start" },
  gateIcon: { width: 40, height: 40, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  gateTitle: { fontSize: 16, fontWeight: "900", minWidth: 0, flexShrink: 1 },
  gateSubtitle: { marginTop: 3, fontSize: 12, fontWeight: "700", lineHeight: 16, minWidth: 0, flexShrink: 1 },

  centered: { alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 10, fontSize: 13, fontWeight: "700", minWidth: 0, flexShrink: 1 },

  cardTitle: { fontSize: 16, fontWeight: "900", letterSpacing: -0.2, minWidth: 0, flexShrink: 1 },
  cardSubtitle: { marginTop: 4, fontSize: 12, fontWeight: "700", minWidth: 0, flexShrink: 1 },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardHeaderRowStack: { flexDirection: "column", alignItems: "flex-start" },

  prioritiesRow: { flexDirection: "row", gap: 14 },
  prioritiesRowStack: { flexDirection: "column" },
  healthBlock: { flexBasis: "40%", minWidth: 110, maxWidth: 164 },
  healthBlockStack: { width: "100%", flexDirection: "row", alignItems: "center", gap: 12 },
  ringWrap: { width: 72, height: 72, alignItems: "center", justifyContent: "center" },
  ringCenter: { position: "absolute", alignItems: "center", justifyContent: "center" },
  ringValue: { fontSize: 14, fontWeight: "900", minWidth: 0, flexShrink: 1 },
  ringLabel: { marginTop: 1, fontSize: 10, fontWeight: "800", minWidth: 0, flexShrink: 1 },
  healthTitle: { marginTop: 10, fontSize: 13, fontWeight: "900", minWidth: 0, flexShrink: 1 },
  healthHint: { marginTop: 2, fontSize: 11, fontWeight: "700", minWidth: 0, flexShrink: 1 },

  counterCol: { flex: 1, gap: 10 },
  counterColStack: { width: "100%" },
  counterCard: { padding: 12, borderWidth: 1, minWidth: 0 },
  counterValue: { marginTop: 10, fontSize: 18, fontWeight: "900", minWidth: 0, flexShrink: 1 },
  counterLabel: { marginTop: 2, fontSize: 12, fontWeight: "800", minWidth: 0, flexShrink: 1 },

  ctaRow: { flexDirection: "row", gap: 10 },
  ctaRowStack: { flexDirection: "column" },
  primaryCta: { flex: 1, minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryCtaText: { fontSize: 13, fontWeight: "900", minWidth: 0, flexShrink: 1 },
  secondaryCta: { flex: 1, minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1 },
  secondaryCtaText: { fontSize: 13, fontWeight: "900", minWidth: 0, flexShrink: 1 },

  errorText: { fontSize: 12, fontWeight: "800", minWidth: 0, flexShrink: 1 },
  retryText: { fontSize: 12, fontWeight: "900", minWidth: 0, flexShrink: 1 },

  segment: { flexDirection: "row", padding: 6, borderWidth: 1 },
  segmentStack: { marginTop: 10, alignSelf: "flex-start" },
  segmentOption: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, minWidth: 0, flexShrink: 1, justifyContent: "center" },
  segmentText: { fontSize: 11, fontWeight: "900", minWidth: 0, flexShrink: 1 },

  emptyAlerts: { marginTop: 14, padding: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  emptyIconWrap: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 13, fontWeight: "900", minWidth: 0, flexShrink: 1 },
  emptySubtitle: { marginTop: 2, fontSize: 12, fontWeight: "700", minWidth: 0, flexShrink: 1 },

  alertRowWrap: { borderBottomWidth: 1, paddingBottom: 14, marginBottom: 14 },
  alertRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  listRowStack: { flexDirection: "column", alignItems: "stretch" },
  alertName: { fontSize: 13, fontWeight: "900" },
  alertSku: { fontSize: 11, fontWeight: "700" },

  metricsRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  metric: { flex: 1, padding: 10, borderWidth: 1 },
  metricLabel: { fontSize: 10, fontWeight: "900", minWidth: 0, flexShrink: 1 },
  metricValue: { marginTop: 3, fontSize: 13, fontWeight: "900", minWidth: 0, flexShrink: 1 },

  addStockButton: { minHeight: 40, paddingHorizontal: 12, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  rowActionButtonCompact: { alignSelf: "flex-start", marginTop: 6 },
  addStockText: { fontSize: 12, fontWeight: "900", minWidth: 0, flexShrink: 1 },

  viewAllRow: { minHeight: 46, borderWidth: 1, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  viewAllText: { fontSize: 12, fontWeight: "900", minWidth: 0, flexShrink: 1 },

  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  kpiGridStack: { gap: 10 },
  kpiCell: { width: "48%", padding: 12, borderWidth: 1 },
  kpiCellSingle: { width: "100%" },
  kpiTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  kpiTitle: { fontSize: 11, fontWeight: "900", flex: 1 },
  kpiIcon: { width: 32, height: 32, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  kpiValue: { marginTop: 10, fontSize: 14, fontWeight: "900" },

  emptyInline: { marginTop: 14, padding: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  emptyInlineText: { fontSize: 12, fontWeight: "800", flex: 1, minWidth: 0, flexShrink: 1 },

  recentRowWrap: { borderBottomWidth: 1, paddingBottom: 14, marginBottom: 14 },
  recentRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  recentName: { fontSize: 13, fontWeight: "900", minWidth: 0, flexShrink: 1 },
  recentMeta: { fontSize: 11, fontWeight: "800", minWidth: 0, flexShrink: 1 },
  adjustButton: { minHeight: 40, paddingHorizontal: 12, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  adjustText: { fontSize: 12, fontWeight: "900", minWidth: 0, flexShrink: 1 },
});
