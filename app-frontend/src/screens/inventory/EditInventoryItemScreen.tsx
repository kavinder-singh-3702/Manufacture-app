import { useState, useCallback, useEffect, useMemo } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { InputField } from "../../components/common/InputField";
import { Button } from "../../components/common/Button";
import { productService, CreateProductInput, Product, ProductCategory } from "../../services/product.service";
import { productVariantService } from "../../services/productVariant.service";
import { RootStackParamList } from "../../navigation/types";
import { useToast } from "../../components/ui/Toast";
import { syncProductFromVariants } from "./components/variantDomain";

const UNITS = ["units", "pieces", "kg", "liters", "meters", "boxes", "pallets"];

export const EditProductScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "EditProduct">>();
  const { productId } = route.params;
  const { success: toastSuccess, error: toastError } = useToast();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [variantSummary, setVariantSummary] = useState({ total: 0, inStock: 0, totalQty: 0 });

  const [formData, setFormData] = useState<CreateProductInput>({
    name: "",
    description: "",
    sku: "",
    category: "",
    subCategory: "",
    price: { amount: 0, currency: "INR", unit: "unit" },
    availableQuantity: 0,
    minStockQuantity: 0,
    unit: "units",
    visibility: "public",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback(
    (field: keyof CreateProductInput, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors]
  );

  const updatePriceField = useCallback((field: "amount" | "currency" | "unit", value: any) => {
    setFormData((prev) => ({
      ...prev,
      price: { ...prev.price, [field]: value },
    }));
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const res = await productService.getCategoryStats({ scope: "company" });
      setCategories(
        (res.categories || []).map((item) => ({
          ...item,
          subCategories: item.subCategories,
        }))
      );
    } catch (err) {
      console.warn("Failed to load categories", (err as any)?.message || err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchItem = useCallback(async () => {
    try {
      const item: Product = await productService.getById(productId, { scope: "company", includeVariantSummary: true });
      setFormData({
        name: item.name,
        description: item.description || "",
        sku: item.sku || "",
        category: item.category,
        subCategory: item.subCategory || "",
        price: {
          amount: item.price?.amount || 0,
          currency: item.price?.currency || "INR",
          unit: item.price?.unit || "unit",
        },
        availableQuantity: item.availableQuantity,
        minStockQuantity: item.minStockQuantity,
        unit: item.unit || "units",
        visibility: item.visibility || "public",
        status: item.status,
      });

      try {
        const variants = await productVariantService.listAll(productId, { scope: "company" });
        const active = variants.filter((variant) => variant.status === "active");
        const totalQty = active.reduce((sum, variant) => sum + Number(variant.availableQuantity || 0), 0);
        const inStock = active.filter((variant) => Number(variant.availableQuantity || 0) > 0).length;
        setVariantSummary({ total: active.length, inStock, totalQty });
      } catch {
        setVariantSummary({ total: Number(item.variantSummary?.totalVariants || 0), inStock: Number(item.variantSummary?.inStockVariants || 0), totalQty: Number(item.availableQuantity || 0) });
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load product");
      navigation.goBack();
    }
  }, [navigation, productId]);

  useEffect(() => {
    const init = async () => {
      try {
        setFetching(true);
        await Promise.all([fetchCategories(), fetchItem()]);
      } finally {
        setFetching(false);
      }
    };
    init();
  }, [fetchCategories, fetchItem]);

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  const selectedCategory = useMemo(() => categories.find((c) => c.id === formData.category), [categories, formData.category]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }
    if (!formData.category) {
      newErrors.category = "Please select a category";
    }
    if (formData.availableQuantity !== undefined && formData.availableQuantity < 0) {
      newErrors.availableQuantity = "Quantity cannot be negative";
    }
    if (Number(formData.price.amount || 0) <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await productService.update(productId, formData);
      toastSuccess("Product updated", formData.name || "Saved");
      navigation.goBack();
    } catch (error: any) {
      toastError("Update failed", error.message || "Failed to update product.");
    } finally {
      setLoading(false);
    }
  }, [formData, navigation, productId, toastError, toastSuccess, validate]);

  const handleDelete = useCallback(() => {
    Alert.alert("Delete Product", "Are you sure you want to delete this product?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await productService.delete(productId);
            Alert.alert("Deleted", "Product has been removed.", [{ text: "OK", onPress: () => navigation.goBack() }]);
          } catch (error: any) {
            toastError("Delete failed", error.message || "Failed to delete product.");
            setLoading(false);
          }
        },
      },
    ]);
  }, [navigation, productId, toastError]);

  const handleSyncFromVariants = useCallback(async () => {
    setSyncing(true);
    try {
      await syncProductFromVariants(productId, "company");
      await fetchItem();
      toastSuccess("Synced", "Product stock and price updated from variants.");
    } catch (err: any) {
      toastError("Sync failed", err?.message || "Could not sync product from variants.");
    } finally {
      setSyncing(false);
    }
  }, [fetchItem, productId, toastError, toastSuccess]);

  if (fetching) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={[styles.header, { borderBottomColor: colors.border, padding: spacing.lg }]}> 
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backButton, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Product</Text>
          <TouchableOpacity onPress={handleDelete}>
            <Text style={[styles.deleteButton, { color: colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <View
            style={[
              styles.variantPanel,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: spacing.md,
                marginBottom: spacing.lg,
              },
            ]}
          >
            <View style={styles.variantPanelTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.variantPanelTitle, { color: colors.text }]}>Variant summary</Text>
                <Text style={[styles.variantPanelSubtitle, { color: colors.textMuted }]}>Keep product totals synced from variant data.</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("ProductVariants", {
                    productId,
                    productName: formData.name,
                    scope: "company",
                  })
                }
              >
                <Text style={[styles.variantsButton, { color: colors.primary }]}>Manage</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.variantStatsRow}>
              <View style={[styles.variantStatPill, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}> 
                <Text style={[styles.variantStatPillText, { color: colors.text }]}>{variantSummary.total} variants</Text>
              </View>
              <View style={[styles.variantStatPill, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}> 
                <Text style={[styles.variantStatPillText, { color: colors.success }]}>{variantSummary.inStock} in stock</Text>
              </View>
              <View style={[styles.variantStatPill, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}> 
                <Text style={[styles.variantStatPillText, { color: colors.text }]}>{variantSummary.totalQty.toLocaleString("en-IN")} qty</Text>
              </View>
            </View>

            <Button
              label={syncing ? "Syncing..." : "Sync product from variants"}
              onPress={handleSyncFromVariants}
              disabled={syncing}
              loading={syncing}
              variant="secondary"
              style={{ marginTop: spacing.sm }}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>Basic Information</Text>

          <InputField
            label="Product Name"
            placeholder="Enter product name"
            value={formData.name}
            onChangeText={(text) => updateField("name", text)}
            errorText={errors.name}
            required
          />

          <InputField
            label="Description"
            placeholder="Describe your product (optional)"
            value={formData.description}
            onChangeText={(text) => updateField("description", text)}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />

          <InputField
            label="SKU / Item Code"
            placeholder="Enter SKU (optional)"
            value={formData.sku}
            onChangeText={(text) => updateField("sku", text.toUpperCase())}
            autoCapitalize="characters"
          />

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md }]}>Classification</Text>

          {errors.category && <Text style={[styles.errorText, { color: colors.error, marginBottom: spacing.sm }]}>{errors.category}</Text>}

          <Text style={[styles.label, { color: colors.textMuted }]}>Category</Text>
          <TouchableOpacity
            onPress={() => setShowCategoryDropdown((prev) => !prev)}
            activeOpacity={0.9}
            style={[
              styles.selectInput,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                marginTop: 8,
              },
            ]}
          >
            <Text style={[styles.selectValue, { color: formData.category ? colors.text : colors.textMuted }]}>
              {formData.category ? categories.find((c) => c.id === formData.category)?.title || formData.category : "Select a category"}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 16 }}>▾</Text>
          </TouchableOpacity>

          {showCategoryDropdown && (
            <View style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md }]}>
              <TextInput
                placeholder="Search categories"
                value={categorySearch}
                onChangeText={setCategorySearch}
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.categorySearch,
                  {
                    borderColor: colors.border,
                    color: colors.text,
                    borderRadius: radius.sm,
                    marginBottom: spacing.sm,
                    backgroundColor: colors.surfaceElevated,
                  },
                ]}
              />
              {loadingCategories ? (
                <ActivityIndicator color={colors.primary} />
              ) : filteredCategories.length === 0 ? (
                <Text style={[styles.errorText, { color: colors.textMuted }]}>No categories match your search</Text>
              ) : (
                <ScrollView style={{ maxHeight: 220 }}>
                  {filteredCategories.map((cat) => {
                    const isSelected = formData.category === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => {
                          updateField("category", cat.id);
                          setShowCategoryDropdown(false);
                        }}
                        style={[
                          styles.dropdownItem,
                          {
                            backgroundColor: isSelected ? colors.primary + "14" : "transparent",
                          },
                        ]}
                      >
                        <Text style={{ color: colors.text, fontWeight: isSelected ? "800" : "600" }}>{cat.title}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          )}

          <View style={{ marginTop: spacing.md }}>
            <InputField
              label="Sub-category"
              placeholder="e.g., Carrots, Fasteners, Polybags"
              value={formData.subCategory || ""}
              onChangeText={(text) => updateField("subCategory", text)}
              helperText="Sub-category improves filters and search quality."
            />
          </View>

          {selectedCategory?.subCategories?.length ? (
            <View style={{ marginTop: spacing.xs, marginBottom: spacing.sm, gap: spacing.xs }}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Suggested sub-categories</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {selectedCategory.subCategories.map((sub) => {
                  const isActive = formData.subCategory?.toLowerCase() === sub.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={sub}
                      onPress={() => updateField("subCategory", sub)}
                      style={[
                        styles.unitChip,
                        {
                          marginVertical: 4,
                          backgroundColor: isActive ? colors.primary + "15" : colors.surface,
                          borderColor: isActive ? colors.primary : colors.border,
                          borderRadius: radius.sm,
                        },
                      ]}
                    >
                      <Text style={[styles.unitText, { color: isActive ? colors.primary : colors.text }]}>{sub}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md }]}>Stock Details</Text>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <InputField
                label="Current Stock"
                placeholder="0"
                value={formData.availableQuantity === 0 ? "" : formData.availableQuantity?.toString() || ""}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, "");
                  updateField("availableQuantity", cleaned === "" ? 0 : parseInt(cleaned, 10));
                }}
                keyboardType="numeric"
                errorText={errors.availableQuantity}
              />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Unit</Text>
              <View style={[styles.unitSelector, { borderRadius: radius.md, marginTop: 8 }]}> 
                {UNITS.map((unit) => {
                  const isSelected = formData.unit === unit;
                  return (
                    <TouchableOpacity
                      key={unit}
                      onPress={() => updateField("unit", unit)}
                      style={[
                        styles.unitChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderRadius: radius.sm,
                        },
                      ]}
                    >
                      <Text style={[styles.unitText, { color: isSelected ? "#fff" : colors.textSecondary }]}>{unit}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md }]}>Pricing</Text>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <InputField
                label="Price Amount"
                placeholder="0.00"
                value={formData.price.amount === 0 ? "" : formData.price.amount.toString()}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9.]/g, "");
                  updatePriceField("amount", cleaned === "" ? 0 : parseFloat(cleaned) || 0);
                }}
                keyboardType="decimal-pad"
                errorText={errors.price}
              />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <InputField
                label="Currency"
                placeholder="INR"
                value={formData.price.currency || "INR"}
                onChangeText={(text) => updatePriceField("currency", text.toUpperCase())}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={{ marginTop: spacing.xl }}>
            <Button label={loading ? "Updating..." : "Save Product"} onPress={handleSubmit} disabled={loading} loading={loading} variant="primary" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  backButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  deleteButton: {
    fontSize: 14,
    fontWeight: "700",
  },
  variantsButton: {
    fontSize: 13,
    fontWeight: "900",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 12,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  selectInput: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  dropdown: {
    marginTop: 8,
    borderWidth: 1,
    padding: 10,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  categorySearch: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  unitSelector: {
    marginBottom: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  unitChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  unitText: {
    fontSize: 13,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  variantPanel: {
    borderWidth: 1,
  },
  variantPanelTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  variantPanelTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  variantPanelSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
  variantStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  variantStatPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  variantStatPillText: {
    fontSize: 12,
    fontWeight: "800",
  },
});

export default EditProductScreen;
