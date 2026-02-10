import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { AppRole } from "../../constants/roles";
import { productService, Product, ProductCategory } from "../../services/product.service";
import { RootStackParamList } from "../../navigation/types";
import { preferenceService } from "../../services/preference.service";
import { useToast } from "../../components/ui/Toast";
import { AmazonStyleProductCard } from "../../components/product/AmazonStyleProductCard";
import { callProductSeller, startProductConversation } from "../product/utils/productContact";
import { useCart } from "../../hooks/useCart";
import { VariantChoiceSelection, VariantChoiceSheet } from "./components/VariantChoiceSheet";
import { hasVariants, variantDisplayLabel } from "./components/variantDomain";

type ProductSearchRoute = RouteProp<RootStackParamList, "ProductSearch">;

const PAGE_SIZE = 20;
const MAX_RECENTS = 8;

type Suggestion = {
  label: string;
  type: "name" | "category" | "sku" | "subCategory";
  categoryId?: string;
  subCategory?: string;
};

export const ProductSearchScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ProductSearchRoute>();
  const { colors, spacing, radius } = useTheme();
  const { success: toastSuccess, error: toastError } = useToast();
  const { user, requestLogin } = useAuth();
  const { addToCart } = useCart();
  const isGuest = user?.role === AppRole.GUEST;

  const [query, setQuery] = useState(route.params?.initialQuery || "");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [categoryChips, setCategoryChips] = useState<ProductCategory[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [seedProducts, setSeedProducts] = useState<Product[]>([]);
  const [variantChoiceVisible, setVariantChoiceVisible] = useState(false);
  const [variantChoiceProduct, setVariantChoiceProduct] = useState<Product | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLoggedSearch = useRef<string>("");
  const resultsRef = useRef<Product[]>([]);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await productService.getCategoryStats({
        scope: "marketplace",
      });
      setCategoryChips(res.categories || []);
    } catch (err) {
      // Non-blocking
      console.warn("Failed to load category chips", (err as any)?.message || err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const executeSearch = useCallback(
    async (termOverride?: string, reset = true) => {
      const term = (termOverride ?? query).trim();
      if (!term) {
        setResults([]);
        setHasMore(false);
        setSubmittedQuery("");
        setError(null);
        setSuggestions([]);
        return;
      }

      const offset = reset ? 0 : resultsRef.current.length;
      if (reset) {
        setLoading(true);
      } else {
        setFetchingMore(true);
      }
      setError(null);

      try {
        const response = await productService.getAll({
          search: term,
          limit: PAGE_SIZE,
          offset,
          scope: "marketplace",
          includeVariantSummary: true,
        });

        setResults((prev) => {
          const merged = reset ? response.products : [...prev, ...response.products];
          resultsRef.current = merged;
          return merged;
        });
        setHasMore(response.pagination?.hasMore ?? false);

        const nextSuggestions: Suggestion[] = [];
        const seen = new Set<string>();
        response.products.forEach((p) => {
          const push = (label: string, type: Suggestion["type"], extra?: Partial<Suggestion>) => {
            const key = `${type}:${(label || "").toLowerCase()}:${extra?.categoryId || ""}`;
            if (label && !seen.has(key) && nextSuggestions.length < 8) {
              seen.add(key);
              nextSuggestions.push({ label, type, ...extra });
            }
          };
          push(p.name, "name");
          if (p.subCategory) push(p.subCategory, "subCategory", { categoryId: p.category, subCategory: p.subCategory });
          push(p.category, "category", { categoryId: p.category });
          if (p.sku) push(p.sku, "sku");
        });
        setSuggestions(nextSuggestions);

        if (reset) {
          setSubmittedQuery(term);
          if (term !== lastLoggedSearch.current) {
            lastLoggedSearch.current = term;
            preferenceService
              .logEvent({ type: "search", searchTerm: term, meta: { source: "global_search" } })
              .catch((err) => console.warn("Failed to log search", err?.message || err));
            const updated = [term, ...recentSearches.filter((t) => t.toLowerCase() !== term.toLowerCase())];
            setRecentSearches(updated.slice(0, MAX_RECENTS));
          }
          // save a small set of products for "continue browsing" rail
          setSeedProducts(response.products.slice(0, 6));
        }
      } catch (err: any) {
        const message = err?.message || "Failed to search products";
        setError(message);
      } finally {
        setLoading(false);
        setFetchingMore(false);
      }
    },
    [query]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      executeSearch(undefined, true);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, executeSearch]);

  const handleLoadMore = useCallback(() => {
    if (fetchingMore || loading || !hasMore) return;
    executeSearch(undefined, false);
  }, [executeSearch, fetchingMore, hasMore, loading]);

  const handleSuggestionPress = useCallback(
    (sug: Suggestion) => {
      if (sug.type === "category" || sug.type === "subCategory") {
        const catId = sug.categoryId || sug.label;
        const catTitle = categoryChips.find((c) => c.id === catId)?.title || sug.label;
        navigation.navigate("CategoryProducts", {
          categoryId: catId,
          title: catTitle,
          subCategory: sug.type === "subCategory" ? sug.label : undefined,
        });
        return;
      }
      setQuery(sug.label);
      executeSearch(sug.label, true);
    },
    [categoryChips, executeSearch, navigation]
  );

  const applyCartSelection = useCallback(
    (selection: VariantChoiceSelection) => {
      if (selection.mode === "variant") {
        addToCart(selection.product, 1, {
          id: selection.variant._id,
          title: variantDisplayLabel(selection.variant),
          options: (selection.variant.options || {}) as Record<string, unknown>,
          price: selection.variant.price || null,
          unit: selection.variant.unit || selection.variant.price?.unit || selection.product.unit,
        });
        toastSuccess("Added variant", variantDisplayLabel(selection.variant));
      } else {
        addToCart(selection.product, 1);
        toastSuccess("Added to cart", selection.product.name);
      }

      preferenceService
        .logEvent({
          type: "view_product",
          productId: selection.product._id,
          category: selection.product.category,
          quantity: 1,
          meta: { action: "add_to_cart" },
        })
        .catch(() => {});
    },
    [addToCart, toastSuccess]
  );

  const closeVariantChoice = useCallback(() => {
    setVariantChoiceVisible(false);
    setVariantChoiceProduct(null);
  }, []);

  const handleAddToCart = useCallback(
    (product: Product) => {
      if (hasVariants(product)) {
        setVariantChoiceProduct(product);
        setVariantChoiceVisible(true);
        return;
      }
      applyCartSelection({ mode: "base", product });
    },
    [applyCartSelection]
  );

  const renderItem = useCallback(
    ({ item }: { item: Product }) => {
      return (
        <AmazonStyleProductCard
          product={item}
          onPress={(id) => navigation.navigate("ProductDetails", { productId: id })}
          onMessagePress={(product) =>
            startProductConversation({
              product,
              isGuest,
              requestLogin,
              navigation,
              toastError: (title, message) => {
                toastError(title, message);
              },
            })
          }
          onCallPress={(product) =>
            callProductSeller({
              product,
              toastError: (title, message) => {
                toastError(title, message);
              },
            })
          }
          showPrimaryAction
          primaryActionLabel="Add to cart"
          onPrimaryActionPress={(product) => handleAddToCart(product)}
        />
      );
    },
    [handleAddToCart, isGuest, navigation, requestLogin, toastError]
  );

  const keyExtractor = useCallback((item: Product) => item._id, []);

  const topChips = useMemo(() => categoryChips.filter((c) => c.count > 0).slice(0, 10), [categoryChips]);
  const continueRail = useMemo(() => {
    if (seedProducts.length) return seedProducts;
    return results.slice(0, 6);
  }, [results, seedProducts]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(108, 99, 255, 0.12)", "rgba(74, 201, 255, 0.06)", "transparent"]}
        locations={[0, 0.3, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.backButton, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Search products</Text>
          <View style={{ width: 60 }} />
        </View>

        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
            },
          ]}
        >
          <Text style={[styles.searchIcon, { color: colors.textMuted }]}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, SKU, or description"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => executeSearch(undefined, true)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Text style={[styles.clearText, { color: colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {submittedQuery ? (
          <Text style={[styles.subText, { color: colors.textMuted }]}>Results for “{submittedQuery}”</Text>
        ) : (
          <Text style={[styles.subText, { color: colors.textMuted }]}>Start typing to search across all products</Text>
        )}

        {query.trim().length > 0 && suggestions.length > 0 ? (
          <View style={{ marginTop: spacing.sm }}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Suggestions</Text>
            <View style={styles.suggestionList}>
              {suggestions.map((sug) => (
                <TouchableOpacity
                  key={`${sug.type}-${sug.categoryId || ""}-${sug.label}`}
                  style={[
                    styles.suggestionRow,
                    { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md },
                  ]}
                  onPress={() => handleSuggestionPress(sug)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.suggestionIcon, { backgroundColor: colors.primary + "12" }]}>
                    <Text style={{ fontSize: 14 }}>🔎</Text>
                  </View>
                  <Text style={[styles.suggestionText, { color: colors.text }]} numberOfLines={1}>
                    {sug.label}
                  </Text>
                  <Text style={[styles.suggestionType, { color: colors.textMuted }]}>{sug.type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {!submittedQuery && query.trim().length === 0 ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
          keyboardShouldPersistTaps="handled"
        >
          {recentSearches.length > 0 && (
            <View style={{ marginBottom: spacing.lg }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent searches</Text>
                <TouchableOpacity
                  onPress={() => {
                    setRecentSearches([]);
                  }}
                >
                  <Text style={[styles.clearLink, { color: colors.primary }]}>Clear</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.recentChipGrid}>
                {recentSearches.map((term) => (
                  <TouchableOpacity
                    key={term}
                    style={[
                      styles.recentChip,
                      { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill },
                    ]}
                    onPress={() => handleSuggestionPress({ label: term, type: "name" })}
                  >
                    <Text style={[styles.recentChipText, { color: colors.text }]} numberOfLines={1}>
                      {term}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {continueRail.length > 0 && (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.sm }]}>
                Continue browsing{submittedQuery ? ` for ${submittedQuery}` : ""}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
                {continueRail.map((item) => {
                  const priceLabel = `${item.price?.currency || "INR"} ${item.price?.amount ?? ""}`;
                  return (
                    <TouchableOpacity
                      key={item._id}
                      style={[
                        styles.horizontalCard,
                        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg },
                      ]}
                      onPress={() => navigation.navigate("ProductDetails", { productId: item._id })}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.hCardName, { color: colors.text }]} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <Text style={[styles.hCardMeta, { color: colors.textMuted }]}>
                          {item.availableQuantity} {item.unit || item.price?.unit || "units"}
                        </Text>
                        <Text style={[styles.hCardPrice, { color: colors.primary }]}>{priceLabel}</Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.hAddButton,
                          { borderColor: colors.primary, borderRadius: radius.sm, backgroundColor: colors.surface },
                        ]}
                        onPress={() => handleAddToCart(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.hAddText, { color: colors.primary }]}>ADD</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      ) : null}

      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: colors.error + "15", borderColor: colors.error }]}>
          <Text style={[styles.errorTitle, { color: colors.error }]}>Search failed</Text>
          <Text style={[styles.errorBody, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => executeSearch(undefined, true)}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!submittedQuery && query.trim().length > 0 && topChips.length > 0 && (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Quick picks</Text>
          <View style={styles.chipRow}>
            {topChips.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.pill,
                  },
                ]}
                onPress={() =>
                  navigation.navigate("CategoryProducts", {
                    categoryId: cat.id,
                    title: cat.title,
                  })
                }
              >
                <Text style={[styles.chipText, { color: colors.text }]}>{cat.title}</Text>
                <Text style={[styles.chipCount, { color: colors.textMuted }]}>{cat.count}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {query.trim().length > 0 && (
        <FlatList
          data={results}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListHeaderComponent={
            submittedQuery ? (
              <Text style={[styles.sectionTitle, { color: colors.text, marginHorizontal: spacing.xs, marginBottom: spacing.sm }]}>
                Showing results for “{submittedQuery}”
              </Text>
            ) : null
          }
          ListEmptyComponent={
            loading ? null : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔎</Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {submittedQuery ? "No products match this search" : "Search for any product"}
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                  {submittedQuery ? "Try a different keyword or category" : "Use the search bar above to get started"}
                </Text>
              </View>
            )
          }
          onEndReachedThreshold={0.5}
          onEndReached={handleLoadMore}
          ListFooterComponent={
            fetchingMore ? (
              <View style={{ paddingVertical: spacing.md }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}

      {loading && results.length === 0 ? (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.background + "80" }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Searching products...</Text>
        </View>
      ) : null}

      <VariantChoiceSheet
        visible={variantChoiceVisible}
        product={variantChoiceProduct}
        scope="marketplace"
        title="Add product to cart"
        subtitle="Choose the base product or pick a specific variant."
        onClose={closeVariantChoice}
        onSelect={async (selection) => {
          applyCartSelection(selection);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    fontSize: 16,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  clearText: {
    fontSize: 14,
    paddingHorizontal: 6,
  },
  subText: {
    fontSize: 13,
    fontWeight: "500",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  chipCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  suggestionList: {
    marginTop: 4,
    gap: 8,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 10,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  suggestionType: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  clearLink: {
    fontSize: 13,
    fontWeight: "700",
  },
  recentChipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  recentChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  recentChipText: {
    fontSize: 13,
    fontWeight: "700",
    maxWidth: 140,
  },
  horizontalCard: {
    width: 190,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  hCardName: {
    fontSize: 14,
    fontWeight: "800",
  },
  hCardMeta: {
    fontSize: 12,
    fontWeight: "600",
  },
  hCardPrice: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2,
  },
  hAddButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  hAddText: {
    fontSize: 13,
    fontWeight: "800",
  },
  card: {
    padding: 14,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
  },
  productMeta: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  priceLabel: {
    fontSize: 15,
    fontWeight: "800",
  },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "800",
  },
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  errorBody: {
    fontSize: 13,
    fontWeight: "600",
  },
  retryButton: {
    alignSelf: "flex-start",
    marginTop: 6,
  },
  retryText: {
    fontSize: 13,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    gap: 6,
  },
  emptyIcon: {
    fontSize: 44,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
