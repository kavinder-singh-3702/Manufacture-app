import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { preferenceService, PreferenceSummary, PersonalizedOffer } from "../../services/preference.service";
import { productService, Product, ProductCategory } from "../../services/product.service";
import { ServiceType } from "../../services/serviceRequest.service";
import { RootStackParamList } from "../../navigation/types";

type RouteProps = RouteProp<RootStackParamList, "UserPreferences">;

const metricLabel = (label: string, value?: number) => `${label}: ${value ?? 0}`;
const SERVICE_TYPE_OPTIONS: ServiceType[] = ["machine_repair", "worker", "transport"];

export const UserPreferenceScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProps>();
  const { userId, displayName } = route.params;

  const [summary, setSummary] = useState<PreferenceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [offers, setOffers] = useState<PersonalizedOffer[]>([]);
  const [creating, setCreating] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [campaignType, setCampaignType] = useState<"product" | "service">("product");
  const [serviceType, setServiceType] = useState<ServiceType>("machine_repair");
  const [form, setForm] = useState({
    productId: "",
    title: "",
    message: "",
    newPrice: "",
    oldPrice: "",
    minOrderValue: "",
    expiresAt: "",
  });

  const fetchSummary = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await preferenceService.getUserSummary(userId, { days: 60, limit: 5 });
      setSummary(data);
    } catch (err: any) {
      setError(err.message || "Failed to load preferences");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadOffers = useCallback(async () => {
    try {
      const { offers: list } = await preferenceService.listUserOffers(userId, { includeExpired: true });
      setOffers(list || []);
    } catch (err: any) {
      console.warn("Failed to load personalized offers", err?.message || err);
    }
  }, [userId]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await productService.getCategoryStats();
      setCategories(res.categories || []);
    } catch (err: any) {
      console.warn("Failed to load categories for offers", err?.message || err);
    }
  }, []);

  const loadProductsForCategory = useCallback(async (categoryId: string) => {
    if (!categoryId) return;
    setProductsLoading(true);
    try {
      const res = await productService.getProductsByCategory(categoryId, { limit: 200 });
      setProducts(res.products || []);
    } catch (err: any) {
      console.warn("Failed to load products for category", err?.message || err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    loadOffers();
    loadCategories();
  }, [fetchSummary, loadOffers, loadCategories]);

  const actionCounts = useMemo(() => summary?.actionCounts ?? {}, [summary?.actionCounts]);

  const formatDate = (value?: string) => {
    if (!value) return "";
    const d = new Date(value);
    return d.toLocaleString();
  };

  const handleCreateOffer = useCallback(async () => {
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      setOfferError("Title is required");
      return;
    }
    if (trimmedTitle.length < 3) {
      setOfferError("Title must be at least 3 characters");
      return;
    }
    if (campaignType === "product" && (!form.productId || !form.newPrice)) {
      setOfferError("Product, title, and new price are required for product campaigns");
      return;
    }
    setCreating(true);
    setOfferError(null);
    try {
      await preferenceService.createCampaign(userId, {
        contentType: campaignType,
        serviceType: campaignType === "service" ? serviceType : undefined,
        productId: campaignType === "product" ? form.productId.trim() : undefined,
        title: trimmedTitle,
        message: form.message.trim() || undefined,
        newPrice: campaignType === "product" ? Number(form.newPrice) : undefined,
        oldPrice: campaignType === "product" && form.oldPrice ? Number(form.oldPrice) : undefined,
        minOrderValue: campaignType === "product" && form.minOrderValue ? Number(form.minOrderValue) : undefined,
        expiresAt: form.expiresAt || undefined,
      });
      setForm({ productId: "", title: "", message: "", newPrice: "", oldPrice: "", minOrderValue: "", expiresAt: "" });
      setProducts([]);
      await loadOffers();
      setOfferError(null);
    } catch (err: any) {
      const validationErrors = Array.isArray(err?.data?.errors)
        ? err.data.errors.map((e: any) => e?.msg || "").filter(Boolean)
        : [];
      const apiMsg =
        validationErrors.join(", ") ||
        err?.data?.error ||
        err?.data?.message ||
        (typeof err?.data === "string" ? err.data : undefined) ||
        err?.message ||
        "Failed to create offer";
      console.warn("Create offer failed", { status: err?.status, data: err?.data, message: err?.message });
      const statusInfo = err?.status ? ` (status ${err.status})` : "";
      setOfferError(`${apiMsg}${statusInfo}`);
    } finally {
      setCreating(false);
    }
  }, [campaignType, form, loadOffers, serviceType, userId]);

  const renderTopList = (
    title: string,
    items: Array<{ label: string; count: number; extra?: string | number }>,
    emptyLabel: string
  ) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {items.length === 0 ? (
        <Text style={[styles.emptyLabel, { color: colors.textSecondary }]}>{emptyLabel}</Text>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {items.map((item) => (
            <View key={item.label} style={[styles.row, { justifyContent: "space-between" }]}>
              <Text style={[styles.rowLabel, { color: colors.text }]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
                {item.label}
              </Text>
              <Text style={[styles.rowValue, { color: colors.primary }]}>
                {item.count}
                {item.extra !== undefined ? ` • ${item.extra}` : ""}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.centered, { padding: spacing.lg }]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ marginTop: spacing.sm, color: colors.textMuted, fontWeight: "600" }}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.centered, { padding: spacing.lg }]}>
          <Text style={{ color: colors.error, fontWeight: "700", marginBottom: spacing.sm }}>{error}</Text>
          <TouchableOpacity onPress={fetchSummary} style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: radius.md }]}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["rgba(99, 102, 241, 0.12)", "transparent"]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
        <View style={[styles.header, { marginBottom: spacing.md }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>User Preferences</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {displayName || "User"} • Last {summary?.windowDays ?? 60} days
          </Text>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => navigation.navigate("CampaignStudio")}
            style={[styles.studioButton, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}
          >
            <Text style={[styles.studioButtonText, { color: colors.primary }]}>Open Campaign Studio</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.heroCard, { borderRadius: radius.lg, overflow: "hidden" }]}>
          <LinearGradient colors={["#0EA5E9", "#6366F1"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: spacing.lg }}>
            <Text style={styles.heroTitle}>{displayName || "User"}</Text>
            <Text style={styles.heroSubtitle}>High-level intent signals</Text>
            <View style={[styles.metricRow, { marginTop: spacing.md }]}>
              <View style={styles.metricPill}>
                <Text style={styles.metricLabel}>{metricLabel("Searches", actionCounts.search)}</Text>
              </View>
              <View style={styles.metricPill}>
                <Text style={styles.metricLabel}>{metricLabel("Category views", actionCounts.view_category)}</Text>
              </View>
              <View style={styles.metricPill}>
                <Text style={styles.metricLabel}>{metricLabel("Product views", actionCounts.view_product)}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={{ gap: spacing.md, marginTop: spacing.md }}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md }]}>
            <View style={[styles.cardHeader, { marginBottom: spacing.sm }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Quick campaign create</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Publish a product or service campaign for this user</Text>
            </View>
            <View style={{ gap: spacing.sm }}>
              {offerError && (
                <View style={[styles.errorBox, { borderColor: colors.error, backgroundColor: colors.error + "15", borderRadius: radius.sm }]}>
                  <Text style={[styles.errorText, { color: colors.error }]}>{offerError}</Text>
                </View>
              )}
              <View style={{ gap: spacing.xs }}>
                <Text style={[styles.meta, { color: colors.textMuted }]}>Campaign type</Text>
                <View style={{ flexDirection: "row", gap: spacing.xs }}>
                  {(["product", "service"] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => {
                        setCampaignType(type);
                        setOfferError(null);
                      }}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: campaignType === type ? colors.primary + "20" : colors.surface,
                          borderColor: campaignType === type ? colors.primary : colors.border,
                          borderRadius: radius.pill,
                        },
                      ]}
                    >
                      <Text style={{ color: campaignType === type ? colors.primary : colors.text, fontWeight: "700" }}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {campaignType === "product" ? (
                <>
                  <View style={{ gap: spacing.xs }}>
                    <Text style={[styles.meta, { color: colors.textMuted }]}>Pick a category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
                      {categories.map((cat) => (
                        <TouchableOpacity
                          key={cat.id}
                          onPress={() => {
                            setForm((prev) => ({ ...prev, productId: "", oldPrice: "", newPrice: "", minOrderValue: "" }));
                            loadProductsForCategory(cat.id);
                          }}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                              borderRadius: radius.pill,
                            },
                          ]}
                        >
                          <Text style={{ color: colors.text }}>{cat.title}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={{ gap: spacing.xs }}>
                    <Text style={[styles.meta, { color: colors.textMuted }]}>Select product</Text>
                    {productsLoading ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : products.length === 0 ? (
                      <Text style={[styles.meta, { color: colors.textSecondary }]}>Pick a category to see products</Text>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
                        {products.map((prod) => (
                          <TouchableOpacity
                            key={prod._id}
                            onPress={() => {
                              setForm((prev) => ({
                                ...prev,
                                productId: prod._id,
                                title: prev.title || prod.name,
                                oldPrice: prod.price?.amount ? String(prod.price.amount) : "",
                                newPrice: prod.price?.amount ? String(prod.price.amount) : "",
                              }));
                            }}
                            style={[
                              styles.chip,
                              {
                                backgroundColor: form.productId === prod._id ? colors.primary + "20" : colors.surface,
                                borderColor: form.productId === prod._id ? colors.primary : colors.border,
                                borderRadius: radius.pill,
                              },
                            ]}
                          >
                            <Text style={{ color: colors.text }}>{prod.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                </>
              ) : (
                <View style={{ gap: spacing.xs }}>
                  <Text style={[styles.meta, { color: colors.textMuted }]}>Service type</Text>
                  <View style={{ flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" }}>
                    {SERVICE_TYPE_OPTIONS.map((item) => (
                      <TouchableOpacity
                        key={item}
                        onPress={() => setServiceType(item)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: serviceType === item ? colors.primary + "20" : colors.surface,
                            borderColor: serviceType === item ? colors.primary : colors.border,
                            borderRadius: radius.pill,
                          },
                        ]}
                      >
                        <Text style={{ color: serviceType === item ? colors.primary : colors.text, textTransform: "capitalize" }}>
                          {item.replace(/_/g, " ")}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <TextInput
                placeholder="Offer title"
                value={form.title}
                onChangeText={(text) => setForm((prev) => ({ ...prev, title: text }))}
                style={[styles.input, { borderColor: colors.border, color: colors.text, borderRadius: radius.sm }]}
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                placeholder="Message (optional)"
                value={form.message}
                onChangeText={(text) => setForm((prev) => ({ ...prev, message: text }))}
                style={[styles.input, { borderColor: colors.border, color: colors.text, borderRadius: radius.sm }]}
                placeholderTextColor={colors.textMuted}
              />
              {campaignType === "product" ? (
                <>
                  <View style={[styles.row, { gap: spacing.sm }]}>
                    <TextInput
                      placeholder="New price"
                      keyboardType="numeric"
                      value={form.newPrice}
                      onChangeText={(text) => setForm((prev) => ({ ...prev, newPrice: text }))}
                      style={[styles.input, styles.halfInput, { borderColor: colors.border, color: colors.text, borderRadius: radius.sm }]}
                      placeholderTextColor={colors.textMuted}
                    />
                    <TextInput
                      placeholder="Old price (optional)"
                      keyboardType="numeric"
                      value={form.oldPrice}
                      onChangeText={(text) => setForm((prev) => ({ ...prev, oldPrice: text }))}
                      style={[styles.input, styles.halfInput, { borderColor: colors.border, color: colors.text, borderRadius: radius.sm }]}
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={[styles.row, { gap: spacing.sm }]}>
                    <TextInput
                      placeholder="Min order value (optional)"
                      keyboardType="numeric"
                      value={form.minOrderValue}
                      onChangeText={(text) => setForm((prev) => ({ ...prev, minOrderValue: text }))}
                      style={[styles.input, styles.halfInput, { borderColor: colors.border, color: colors.text, borderRadius: radius.sm }]}
                      placeholderTextColor={colors.textMuted}
                    />
                    <TextInput
                      placeholder="Expires at (ISO date, optional)"
                      value={form.expiresAt}
                      onChangeText={(text) => setForm((prev) => ({ ...prev, expiresAt: text }))}
                      style={[styles.input, styles.halfInput, { borderColor: colors.border, color: colors.text, borderRadius: radius.sm }]}
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </>
              ) : (
                <TextInput
                  placeholder="Expires at (ISO date, optional)"
                  value={form.expiresAt}
                  onChangeText={(text) => setForm((prev) => ({ ...prev, expiresAt: text }))}
                  style={[styles.input, { borderColor: colors.border, color: colors.text, borderRadius: radius.sm }]}
                  placeholderTextColor={colors.textMuted}
                />
              )}
              <TouchableOpacity
                onPress={handleCreateOffer}
                disabled={creating}
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary, borderRadius: radius.md, opacity: creating ? 0.7 : 1 },
                ]}
              >
                <Text style={styles.primaryButtonText}>{creating ? "Saving..." : "Create campaign"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {renderTopList(
            "Top categories",
            summary?.topCategories.map((c) => ({ label: c.category, count: c.count })) || [],
            "No category signals yet"
          )}

          {renderTopList(
            "Top search terms",
            summary?.topSearchTerms.map((s) => ({ label: s.term, count: s.count })) || [],
            "No searches recorded"
          )}

          {renderTopList(
            "Top products",
            summary?.topProducts.map((p) => ({
              label: p.name || p.id || "Unknown product",
              count: p.views || p.total || 0,
              extra: `Views ${p.views ?? 0}`,
            })) || [],
            "No product interactions"
          )}

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Recent activity</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Latest 25 events</Text>
            </View>
            {summary?.recentEvents?.length ? (
              <View style={{ gap: spacing.sm }}>
                {summary.recentEvents.map((event) => (
                  <View key={event.id} style={[styles.row, { justifyContent: "space-between" }]}>
                    <View>
                      <Text style={[styles.rowLabel, { color: colors.text }]}>
                        {event.type.replace(/_/g, " ")}
                      </Text>
                      {event.searchTerm && (
                        <Text style={[styles.meta, { color: colors.textMuted }]}>Search: {event.searchTerm}</Text>
                      )}
                      {event.product?.name && (
                        <Text style={[styles.meta, { color: colors.textMuted }]}>Product: {event.product.name}</Text>
                      )}
                      {event.category && !event.product?.name && (
                        <Text style={[styles.meta, { color: colors.textMuted }]}>Category: {event.category}</Text>
                      )}
                    </View>
                    <Text style={[styles.meta, { color: colors.textSecondary, textAlign: "right" }]}>
                      {formatDate(event.createdAt)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.emptyLabel, { color: colors.textSecondary }]}>No recent events</Text>
            )}
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Campaign history</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Active and past campaigns for this user</Text>
            </View>
            {offers.length === 0 ? (
              <Text style={[styles.emptyLabel, { color: colors.textSecondary }]}>No campaigns yet</Text>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {offers.map((offer) => (
                  <View key={offer.id} style={[styles.row, { justifyContent: "space-between" }]}>
                    <View>
                      <Text style={[styles.rowLabel, { color: colors.text }]}>{offer.title}</Text>
                      <Text style={[styles.meta, { color: colors.textMuted }]}>
                        {(offer.contentType || "product").toUpperCase()} •{" "}
                        {offer.contentType === "service"
                          ? offer.serviceType?.replace(/_/g, " ") || "service"
                          : `${offer.product?.name || "Product"}${offer.newPrice ? ` • ₹${offer.newPrice}` : ""}${
                              offer.oldPrice ? ` (was ₹${offer.oldPrice})` : ""
                            }`}
                      </Text>
                      {offer.expiresAt && (
                        <Text style={[styles.meta, { color: colors.textSecondary }]}>Expires {formatDate(offer.expiresAt)}</Text>
                      )}
                    </View>
                    <Text style={[styles.meta, { color: colors.textSecondary }]}>{offer.status}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { gap: 4 },
  title: { fontSize: 24, fontWeight: "800" },
  subtitle: { fontSize: 14, fontWeight: "600" },
  backText: { fontSize: 14, fontWeight: "700" },
  studioButton: { marginTop: 8, borderWidth: 1, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 8 },
  studioButtonText: { fontSize: 12, fontWeight: "800" },
  heroCard: { shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  heroTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  heroSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600", marginTop: 2 },
  metricRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  metricPill: { backgroundColor: "rgba(255,255,255,0.18)", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  metricLabel: { color: "#fff", fontWeight: "700", fontSize: 12 },
  card: { borderWidth: 1 },
  cardHeader: { marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardSubtitle: { fontSize: 12, fontWeight: "600" },
  emptyLabel: { fontSize: 13, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  rowLabel: { fontSize: 14, fontWeight: "600", flexShrink: 1 },
  rowValue: { fontSize: 14, fontWeight: "700" },
  meta: { fontSize: 11, fontWeight: "600" },
  retryButton: { paddingHorizontal: 16, paddingVertical: 10 },
  input: { borderWidth: 1, paddingVertical: 8, paddingHorizontal: 10, fontSize: 14 },
  halfInput: { flex: 1 },
  primaryButton: { paddingVertical: 12, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "700" },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  errorBox: { borderWidth: 1, padding: 8 },
  errorText: { fontSize: 12, fontWeight: "700" },
});
