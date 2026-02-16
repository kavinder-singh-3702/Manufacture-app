import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { productService, Product } from "../../services/product.service";
import { RootStackParamList } from "../../navigation/types";
import { AmazonStyleProductCard } from "../../components/product/AmazonStyleProductCard";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../components/ui/Toast";
import { CompanyRequiredCard } from "../../components/company";
import { callProductSeller, startProductConversation } from "../product/utils/productContact";

export const FilteredProductsScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "FilteredProducts">>();
  const { filter, title } = route.params;
  const { user, requestLogin } = useAuth();
  const { error: toastError } = useToast();
  const hasCompany = Boolean(user?.activeCompany);

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!hasCompany) {
      setItems([]);
      setError(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      const response = await productService.getAll({
        status: filter,
        limit: 100,
        scope: "company",
        includeVariantSummary: true,
      });
      setItems(response.products);
    } catch (err: any) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, hasCompany]);

  // Refresh list whenever screen comes into focus (e.g., after deleting a product)
  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [fetchItems])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItems();
  }, [fetchItems]);

  const handleChooseCompany = useCallback(() => {
    navigation.navigate("CompanyContextPicker", {
      redirectTo: { kind: "stack", screen: "FilteredProducts", params: { filter, title } },
      source: "Inventory",
    });
  }, [filter, navigation, title]);

  const handleEditItem = useCallback(
    (productId: string) => {
      navigation.navigate("EditProduct", { productId });
    },
    [navigation]
  );

  const statusColor = filter === "low_stock" ? "#F59E0B" : "#F45E6C";

  const renderItem = useCallback(
    ({ item }: { item: Product }) => {
      return (
        <AmazonStyleProductCard
          product={item}
          onPress={(productId) => handleEditItem(productId)}
          onMessagePress={(product) =>
            startProductConversation({
              product,
              isGuest: user?.role === "guest",
              requestLogin,
              navigation,
              toastError,
            })
          }
          onCallPress={(product) =>
            callProductSeller({
              product,
              toastError,
            })
          }
          showPrimaryAction
          primaryActionLabel="Edit product"
          onPrimaryActionPress={(product) => handleEditItem(product._id)}
        />
      );
    },
    [handleEditItem, navigation, requestLogin, toastError, user?.role]
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasCompany) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: "center", padding: spacing.md }}>
          <CompanyRequiredCard
            description="Inventory status views require an active company. Choose or create one to continue."
            onPrimaryPress={handleChooseCompany}
            onSecondaryPress={() =>
              navigation.navigate("CompanyCreate", {
                redirectTo: { kind: "stack", screen: "FilteredProducts", params: { filter, title } },
              })
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={filter === "low_stock" ? ["rgba(245, 158, 11, 0.06)", "transparent"] : ["rgba(239, 68, 68, 0.06)", "transparent"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { padding: spacing.lg, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={[styles.summaryCard, { backgroundColor: colors.surface, margin: spacing.md, padding: spacing.md, borderRadius: radius.md }]}>
        <View style={styles.summaryIconWrap}>
          <Ionicons name={filter === "low_stock" ? "warning-outline" : "alert-circle-outline"} size={30} color={statusColor} />
        </View>
        <View style={styles.summaryInfo}>
          <Text style={[styles.summaryCount, { color: statusColor }]}>
            {items.length} {items.length === 1 ? "Product" : "Products"}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            {filter === "low_stock" ? "need restocking soon" : "need urgent restocking"}
          </Text>
        </View>
      </View>

      {error && (
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: colors.error + "20", margin: spacing.md, padding: spacing.md, borderRadius: radius.md },
          ]}
        >
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!error && (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={46} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No products</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Nothing matches this stock status right now
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, fontWeight: "500" },
  header: { borderBottomWidth: 1 },
  backButton: { fontSize: 16, fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  summaryCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryIconWrap: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  summaryInfo: { flex: 1 },
  summaryCount: { fontSize: 18, fontWeight: "800" },
  summaryLabel: { fontSize: 14, fontWeight: "500" },
  errorContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  errorText: { fontSize: 14, fontWeight: "500" },
  retryText: { fontSize: 14, fontWeight: "600" },
  itemCard: { borderWidth: 1 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: "700" },
  itemCategory: { fontSize: 12, fontWeight: "500", marginTop: 2, textTransform: "capitalize" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: "700" },
  itemDetails: { marginTop: 12, gap: 8 },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailLabel: { fontSize: 12, fontWeight: "600" },
  detailValue: { fontSize: 14, fontWeight: "700" },
  actionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  editButton: { paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5, borderRadius: 10 },
  editButtonText: { fontSize: 12, fontWeight: "700" },
  alertBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  alertText: { fontSize: 12, fontWeight: "700" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, fontWeight: "500" },
});
