import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AmazonStyleProductCard } from "../../../components/product/AmazonStyleProductCard";
import { useToast } from "../../../components/ui/Toast";
import { useAuth } from "../../../hooks/useAuth";
import { useTheme } from "../../../hooks/useTheme";
import { useResponsiveLayout } from "../../../hooks/useResponsiveLayout";
import { RootStackParamList } from "../../../navigation/types";
import { Product, productService } from "../../../services/product.service";
import { callProductSeller, startProductConversation } from "../../product/utils/productContact";
import { AdaptiveSingleLineText } from "../../../components/text/AdaptiveSingleLineText";
import { AdaptiveTwoLineText } from "../../../components/text/AdaptiveTwoLineText";
import { useCompanyProfileLayout } from "./companyProfile.layout";

type ProductStatusFilter = "active" | "draft" | "inactive" | "all";
type ProductVisibilityFilter = "public" | "private" | "all";

type CompanyProductsSectionProps = {
  companyId: string;
  isReadOnly: boolean;
  onAddProduct?: () => void;
  onTotalChange?: (total: number) => void;
  onRefreshCompany?: () => Promise<void> | void;
};

const PAGE_SIZE = 12;

const STATUS_FILTERS: Array<{ key: ProductStatusFilter; label: string }> = [
  { key: "active", label: "Active" },
  { key: "draft", label: "Draft" },
  { key: "inactive", label: "Inactive" },
  { key: "all", label: "All" },
];

const VISIBILITY_FILTERS: Array<{ key: ProductVisibilityFilter; label: string }> = [
  { key: "public", label: "Public" },
  { key: "private", label: "Private" },
  { key: "all", label: "Any" },
];

export const CompanyProductsSection = ({
  companyId,
  isReadOnly,
  onAddProduct,
  onTotalChange,
  onRefreshCompany,
}: CompanyProductsSectionProps) => {
  const { colors, spacing, radius } = useTheme();
  const { isCompact, isXCompact } = useResponsiveLayout();
  const layout = useCompanyProfileLayout();
  const styles = useMemo(() => createStyles(colors, spacing, radius, layout), [colors, spacing, radius, layout]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const { user, requestLogin } = useAuth();
  const { error: toastError } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>("active");
  const [visibilityFilter, setVisibilityFilter] = useState<ProductVisibilityFilter>("public");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: PAGE_SIZE,
    offset: 0,
    hasMore: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 280);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchProducts = useCallback(
    async (offset = 0, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else if (!refreshing) {
          setLoading(true);
        }

        setError(null);

        const response = await productService.getAll({
          scope: isReadOnly ? "marketplace" : "company",
          companyId: isReadOnly ? companyId : undefined,
          limit: PAGE_SIZE,
          offset,
          search: searchQuery || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          visibility: visibilityFilter === "all" ? undefined : visibilityFilter,
          includeVariantSummary: true,
        });

        setProducts((previous) => (append ? [...previous, ...(response.products || [])] : response.products || []));
        setPagination(response.pagination || { total: 0, limit: PAGE_SIZE, offset, hasMore: false });
        onTotalChange?.(response.pagination?.total || 0);
      } catch (err: any) {
        setError(err?.message || "Failed to load company products.");
        if (!append) {
          setProducts([]);
          setPagination({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });
          onTotalChange?.(0);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [companyId, isReadOnly, onTotalChange, refreshing, searchQuery, statusFilter, visibilityFilter]
  );

  useEffect(() => {
    if (!isFocused) return;
    fetchProducts(0, false);
  }, [fetchProducts, isFocused]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchProducts(0, false), Promise.resolve(onRefreshCompany?.())]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchProducts, onRefreshCompany]);

  const onLoadMore = useCallback(() => {
    if (loading || refreshing || loadingMore || !pagination.hasMore) return;
    const nextOffset = pagination.offset + pagination.limit;
    fetchProducts(nextOffset, true);
  }, [fetchProducts, loading, loadingMore, pagination.hasMore, pagination.limit, pagination.offset, refreshing]);

  const openProduct = useCallback(
    (productId: string) => {
      const selected = products.find((item) => item._id === productId);
      navigation.navigate("ProductDetails", { productId, product: selected });
    },
    [navigation, products]
  );

  const handleMessage = useCallback(
    (product: Product) => {
      startProductConversation({
        product,
        isGuest: user?.role === "guest",
        requestLogin,
        navigation,
        toastError,
      });
    },
    [navigation, requestLogin, toastError, user?.role]
  );

  const handleCall = useCallback(
    (product: Product) => {
      callProductSeller({
        product,
        toastError,
      });
    },
    [toastError]
  );

  const handleEdit = useCallback(
    (product: Product) => {
      navigation.navigate("EditProduct", { productId: product._id });
    },
    [navigation]
  );

  return (
    <View style={styles.container}>
      <View style={[styles.sectionHeader, isCompact && styles.sectionHeaderCompact]}>
        <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.sectionTitle, { color: colors.text }]}>
          Added Products
        </AdaptiveSingleLineText>
        <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          {pagination.total} listed
        </AdaptiveSingleLineText>
      </View>

      <View
        style={[
          styles.searchRow,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
            minHeight: layout.ctaHeight,
            paddingHorizontal: isXCompact ? 10 : spacing.md,
          },
        ]}
      >
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search added products"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchInput.length ? (
          <TouchableOpacity onPress={() => setSearchInput("")} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.filterGroup}>
        <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.filterLabel, { color: colors.textMuted }]}>
          Status
        </AdaptiveSingleLineText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {STATUS_FILTERS.map((filter) => {
            const isActive = statusFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                activeOpacity={0.85}
                onPress={() => setStatusFilter(filter.key)}
                style={[
                  styles.filterChip,
                  {
                    borderColor: isActive ? colors.primary : colors.border,
                    backgroundColor: isActive ? colors.primary + "18" : colors.surface,
                    minHeight: layout.chipHeight,
                    paddingHorizontal: isXCompact ? 10 : 12,
                  },
                ]}
              >
                <AdaptiveSingleLineText
                  allowOverflowScroll={false}
                  minimumFontScale={0.74}
                  style={[styles.filterChipText, { color: isActive ? colors.primary : colors.text }]}
                >
                  {filter.label}
                </AdaptiveSingleLineText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.filterGroup}>
        <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.filterLabel, { color: colors.textMuted }]}>
          Visibility
        </AdaptiveSingleLineText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {VISIBILITY_FILTERS.map((filter) => {
            const isActive = visibilityFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                activeOpacity={0.85}
                onPress={() => setVisibilityFilter(filter.key)}
                style={[
                  styles.filterChip,
                  {
                    borderColor: isActive ? colors.primary : colors.border,
                    backgroundColor: isActive ? colors.primary + "18" : colors.surface,
                    minHeight: layout.chipHeight,
                    paddingHorizontal: isXCompact ? 10 : 12,
                  },
                ]}
              >
                <AdaptiveSingleLineText
                  allowOverflowScroll={false}
                  minimumFontScale={0.74}
                  style={[styles.filterChipText, { color: isActive ? colors.primary : colors.text }]}
                >
                  {filter.label}
                </AdaptiveSingleLineText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {!isReadOnly && onAddProduct ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onAddProduct}
          style={[styles.addButton, { backgroundColor: colors.primary, minHeight: layout.ctaHeight }]}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.textOnPrimary} />
          <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.addButtonText, { color: colors.textOnPrimary }]}>
            Add Product
          </AdaptiveSingleLineText>
        </TouchableOpacity>
      ) : (
        <View
          style={[
            styles.readOnlyHint,
            isCompact && styles.readOnlyHintCompact,
            { borderColor: colors.border, backgroundColor: colors.surfaceElevated, minHeight: layout.chipHeight + 6 },
          ]}
        >
          <Ionicons name="eye-outline" size={14} color={colors.textMuted} />
          <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.readOnlyHintText, { color: colors.textMuted }]}>
            Read-only company product view
          </AdaptiveSingleLineText>
        </View>
      )}

      {error ? (
        <View
          style={[
            styles.errorBanner,
            isCompact && styles.errorBannerCompact,
            { borderColor: colors.error + "55", backgroundColor: colors.error + "14" },
          ]}
        >
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <AdaptiveTwoLineText minimumFontScale={0.72} style={[styles.errorText, { color: colors.error }]}>
            {error}
          </AdaptiveTwoLineText>
          <TouchableOpacity onPress={() => fetchProducts(0, false)}>
            <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.retryText, { color: colors.primary }]}>
              Retry
            </AdaptiveSingleLineText>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading && !products.length ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.loaderText, { color: colors.textMuted }]}>
            Loading products...
          </AdaptiveSingleLineText>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
          <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.emptyTitle, { color: colors.text }]}>
            No products found
          </AdaptiveSingleLineText>
          <AdaptiveTwoLineText minimumFontScale={0.72} style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Try changing filters or add a new product.
          </AdaptiveTwoLineText>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <AmazonStyleProductCard
              product={item}
              onPress={openProduct}
              onMessagePress={handleMessage}
              onCallPress={handleCall}
              showPrimaryAction={!isReadOnly}
              primaryActionLabel="Edit"
              onPrimaryActionPress={handleEdit}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.35}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const createStyles = (
  colors: ReturnType<typeof useTheme>["colors"],
  spacing: ReturnType<typeof useTheme>["spacing"],
  radius: ReturnType<typeof useTheme>["radius"],
  layout: ReturnType<typeof useCompanyProfileLayout>
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      gap: spacing.sm,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginTop: 2,
      minWidth: 0,
      gap: 8,
    },
    sectionHeaderCompact: {
      flexDirection: "column",
      alignItems: "flex-start",
    },
    sectionTitle: {
      fontSize: layout.compact ? 15 : 16,
      fontWeight: "800",
      letterSpacing: -0.2,
      minWidth: 0,
      flexShrink: 1,
    },
    sectionSubtitle: {
      fontSize: layout.compact ? 11 : 12,
      fontWeight: "600",
      minWidth: 0,
      flexShrink: 1,
    },
    searchRow: {
      minHeight: layout.ctaHeight,
      borderWidth: 1,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minWidth: 0,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      minWidth: 0,
    },
    filterGroup: {
      gap: 6,
    },
    filterLabel: {
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    filterRow: {
      gap: 8,
      minWidth: 0,
    },
    filterChip: {
      borderWidth: 1,
      borderRadius: 999,
      minHeight: layout.chipHeight,
      paddingHorizontal: 12,
      justifyContent: "center",
      minWidth: 0,
      maxWidth: 180,
    },
    filterChipText: {
      fontSize: layout.compact ? 11 : 12,
      fontWeight: "700",
      minWidth: 0,
      flexShrink: 1,
    },
    addButton: {
      minHeight: layout.ctaHeight,
      borderRadius: radius.lg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    addButtonText: {
      fontSize: 13,
      fontWeight: "800",
    },
    readOnlyHint: {
      borderWidth: 1,
      borderRadius: radius.md,
      minHeight: 38,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      minWidth: 0,
    },
    readOnlyHintCompact: {
      justifyContent: "flex-start",
    },
    readOnlyHintText: {
      fontSize: layout.compact ? 11 : 12,
      fontWeight: "700",
      minWidth: 0,
      flexShrink: 1,
    },
    errorBanner: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: 10,
      paddingVertical: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minWidth: 0,
    },
    errorBannerCompact: {
      alignItems: "flex-start",
    },
    errorText: {
      flex: 1,
      fontSize: layout.compact ? 11 : 12,
      fontWeight: "600",
      minWidth: 0,
      flexShrink: 1,
    },
    retryText: {
      fontSize: 12,
      fontWeight: "800",
    },
    loaderWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    loaderText: {
      fontSize: 13,
      fontWeight: "600",
    },
    emptyWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "800",
    },
    emptySubtitle: {
      fontSize: 13,
      fontWeight: "500",
      textAlign: "center",
    },
    footerLoader: {
      paddingVertical: spacing.md,
    },
  });
