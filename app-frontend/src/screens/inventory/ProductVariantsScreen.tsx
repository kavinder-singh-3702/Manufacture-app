import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { useToast } from "../../components/ui/Toast";
import { RootStackParamList } from "../../navigation/types";
import { ProductVariant, ProductVariantUpsertInput, productVariantService } from "../../services/productVariant.service";
import { VariantCardRow } from "./components/VariantCardRow";
import { VariantFormSheet } from "./components/VariantFormSheet";

type ScreenRoute = RouteProp<RootStackParamList, "ProductVariants">;

export const ProductVariantsScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const { success: toastSuccess, error: toastError } = useToast();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ScreenRoute>();

  const { productId, productName, scope = "company" } = route.params;

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [saving, setSaving] = useState(false);

  const loadVariants = useCallback(async () => {
    try {
      setError(null);
      const response = await productVariantService.list(productId, { scope, limit: 100, offset: 0 });
      setVariants(response.variants || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load variants");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [productId, scope]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadVariants();
    }, [loadVariants])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadVariants();
  }, [loadVariants]);

  const openCreate = () => {
    setEditingVariant(null);
    setFormVisible(true);
  };

  const openEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormVisible(true);
  };

  const closeForm = () => {
    setFormVisible(false);
    setEditingVariant(null);
  };

  const saveVariant = async (payload: ProductVariantUpsertInput) => {
    setSaving(true);
    try {
      if (editingVariant?._id) {
        await productVariantService.update(productId, editingVariant._id, payload);
        toastSuccess("Variant updated");
      } else {
        await productVariantService.create(productId, payload);
        toastSuccess("Variant created");
      }
      closeForm();
      loadVariants();
    } catch (err: any) {
      toastError("Save failed", err?.message || "Could not save variant");
    } finally {
      setSaving(false);
    }
  };

  const adjustVariant = async (variant: ProductVariant, delta: number) => {
    try {
      await productVariantService.adjustQuantity(productId, variant._id, delta);
      setVariants((prev) =>
        prev.map((item) =>
          item._id === variant._id
            ? { ...item, availableQuantity: Math.max(0, Number(item.availableQuantity || 0) + delta) }
            : item
        )
      );
      toastSuccess("Variant stock updated");
    } catch (err: any) {
      toastError("Update failed", err?.message || "Could not adjust quantity");
    }
  };

  const deleteVariant = (variant: ProductVariant) => {
    Alert.alert("Delete variant", "Are you sure you want to archive this variant?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await productVariantService.delete(productId, variant._id);
            setVariants((prev) => prev.filter((item) => item._id !== variant._id));
            toastSuccess("Variant deleted");
          } catch (err: any) {
            toastError("Delete failed", err?.message || "Could not delete variant");
          }
        },
      },
    ]);
  };

  const totalInStock = useMemo(() => variants.filter((item) => Number(item.availableQuantity || 0) > 0).length, [variants]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            Variants
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
            {productName || "Product"} • {variants.length} total • {totalInStock} in stock
          </Text>
        </View>
        <TouchableOpacity onPress={openCreate} style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: radius.md }]}>
          <Ionicons name="add" size={18} color={colors.textOnPrimary} />
          <Text style={[styles.addBtnText, { color: colors.textOnPrimary }]}>Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading variants...</Text>
        </View>
      ) : (
        <FlatList
          data={variants}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <VariantCardRow
              variant={item}
              onEdit={() => openEdit(item)}
              onDelete={() => deleteVariant(item)}
              onAdjust={(delta) => adjustVariant(item, delta)}
            />
          )}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={[styles.emptyWrap, { borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface }]}>
              <Ionicons name="albums-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No variants yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Add options like size, weight, or packaging to manage pricing and stock precisely.
              </Text>
              <TouchableOpacity onPress={openCreate} style={[styles.emptyBtn, { backgroundColor: colors.primary, borderRadius: radius.md }]}>
                <Text style={[styles.emptyBtnText, { color: colors.textOnPrimary }]}>Create first variant</Text>
              </TouchableOpacity>
            </View>
          }
          ListHeaderComponent={
            error ? (
              <View style={[styles.errorBox, { borderColor: colors.error + "55", backgroundColor: colors.error + "14", borderRadius: radius.md }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                <TouchableOpacity onPress={loadVariants}>
                  <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      <VariantFormSheet
        visible={formVisible}
        variant={editingVariant}
        onClose={closeForm}
        onSubmit={saveVariant}
        loading={saving}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "900" },
  headerSubtitle: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  addBtn: {
    height: 38,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addBtnText: { fontSize: 12, fontWeight: "900" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { fontSize: 13, fontWeight: "600" },
  emptyWrap: {
    borderWidth: 1,
    alignItems: "center",
    padding: 18,
    marginTop: 24,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "900" },
  emptySubtitle: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  emptyBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  emptyBtnText: { fontSize: 12, fontWeight: "900" },
  errorBox: {
    borderWidth: 1,
    marginBottom: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorText: { fontSize: 12, fontWeight: "700", flex: 1, marginRight: 10 },
  retryText: { fontSize: 12, fontWeight: "900" },
});

export default ProductVariantsScreen;
