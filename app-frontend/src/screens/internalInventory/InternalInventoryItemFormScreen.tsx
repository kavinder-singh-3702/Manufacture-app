import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { RootStackParamList } from "../../navigation/types";
import { InputField } from "../../components/common/InputField";
import { Button } from "../../components/common/Button";
import { internalInventoryService } from "../../services/internalInventory.service";
import { productService, type Product } from "../../services/product.service";
import { useToast } from "../../components/ui/Toast";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type FormState = {
  name: string;
  sku: string;
  category: string;
  unit: string;
  onHandQty: string;
  reorderLevel: string;
  avgCost: string;
};

const DEFAULT_FORM: FormState = {
  name: "",
  sku: "",
  category: "",
  unit: "units",
  onHandQty: "",
  reorderLevel: "",
  avgCost: "",
};

const parseNumber = (value: string, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const InternalInventoryItemFormScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const { success: toastSuccess, error: toastError } = useToast();

  const itemId: string | undefined = route.params?.itemId;
  const isEdit = Boolean(itemId);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Catalog product picker — lets the user pre-fill the internal item
  // form from an existing marketplace product instead of retyping name,
  // sku, category, unit. Purely a QoL shortcut; no linkage is stored.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerProducts, setPickerProducts] = useState<Product[]>([]);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const loadPickerProducts = useCallback(async () => {
    setPickerLoading(true);
    setPickerError(null);
    try {
      const response = await productService.getAll({
        scope: "company",
        limit: 100,
        offset: 0,
      });
      setPickerProducts(response.products || []);
    } catch (err: any) {
      setPickerError(err?.message || "Failed to load products");
      setPickerProducts([]);
    } finally {
      setPickerLoading(false);
    }
  }, []);

  const openPicker = useCallback(() => {
    setPickerOpen(true);
    loadPickerProducts();
  }, [loadPickerProducts]);

  const selectPickerProduct = useCallback((product: Product) => {
    setForm((prev) => ({
      ...prev,
      name: product.name || prev.name,
      sku: (product.sku || prev.sku || "").toUpperCase(),
      category: product.category || prev.category,
      unit: product.price?.unit || product.unit || prev.unit || "units",
    }));
    setErrors({});
    setPickerOpen(false);
  }, []);

  const filteredPickerProducts = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return pickerProducts;
    return pickerProducts.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      const cat = (p.category || "").toLowerCase();
      return name.includes(q) || sku.includes(q) || cat.includes(q);
    });
  }, [pickerProducts, pickerSearch]);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const fetchItem = useCallback(async () => {
    if (!itemId) return;
    try {
      setFetching(true);
      const item = await internalInventoryService.getItem(itemId);
      setForm({
        name: item.name || "",
        sku: item.sku || "",
        category: item.category || "",
        unit: item.unit || "units",
        onHandQty: String(item.onHandQty ?? ""),
        reorderLevel: String(item.reorderLevel ?? ""),
        avgCost: String(item.avgCost ?? ""),
      });
    } catch (err: any) {
      toastError("Load failed", err?.message || "Could not load item.");
      navigation.goBack();
    } finally {
      setFetching(false);
    }
  }, [itemId, navigation, toastError]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const validate = () => {
    const next: Record<string, string> = {};

    if (!form.name.trim()) next.name = "Name is required";
    if (!form.category.trim()) next.category = "Category is required";
    if (!form.unit.trim()) next.unit = "Unit is required";

    const reorderLevel = parseNumber(form.reorderLevel, 0);
    if (reorderLevel < 0) next.reorderLevel = "Reorder level cannot be negative";

    const avgCost = parseNumber(form.avgCost, 0);
    if (avgCost < 0) next.avgCost = "Avg cost cannot be negative";

    if (!isEdit) {
      const onHandQty = parseNumber(form.onHandQty, 0);
      if (onHandQty < 0) next.onHandQty = "On hand quantity cannot be negative";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const payload = useMemo(() => {
    const base = {
      name: form.name.trim(),
      sku: form.sku.trim() || undefined,
      category: form.category.trim(),
      unit: form.unit.trim(),
      reorderLevel: parseNumber(form.reorderLevel, 0),
      avgCost: parseNumber(form.avgCost, 0),
    };

    if (isEdit) return base;

    return {
      ...base,
      onHandQty: parseNumber(form.onHandQty, 0),
    };
  }, [form.avgCost, form.category, form.name, form.onHandQty, form.reorderLevel, form.sku, form.unit, isEdit]);

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      if (isEdit && itemId) {
        await internalInventoryService.updateItem(itemId, payload);
        toastSuccess("Item updated", form.name || "Item saved");
      } else {
        await internalInventoryService.createItem(payload as any);
        toastSuccess("Item added", form.name || "Item created");
      }
      navigation.goBack();
    } catch (err: any) {
      toastError("Save failed", err?.message || "Could not save item right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!itemId) return;

    Alert.alert("Delete item", "Remove this inventory item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await internalInventoryService.deleteItem(itemId);
            toastSuccess("Item deleted", "Item removed.");
            navigation.goBack();
          } catch (err: any) {
            toastError("Delete failed", err?.message || "Could not delete item.");
            setLoading(false);
          }
        },
      },
    ]);
  };

  if (fetching) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loaderText, { color: colors.textMuted }]}>Loading item...</Text>
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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backButtonHit}
          >
            <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{isEdit ? "Edit Item" : "Add Item"}</Text>
          {isEdit ? (
            <TouchableOpacity onPress={handleDelete}>
              <Text style={[styles.deleteText, { color: colors.error }]}>Delete</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 48 }} />
          )}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl + 90 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <View
            style={[
              styles.infoCard,
              {
                borderRadius: radius.md,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                padding: spacing.md,
                marginBottom: spacing.lg,
              },
            ]}
          >
            <Text style={[styles.infoTitle, { color: colors.text }]}>Not listed publicly</Text>
            <Text style={[styles.infoText, { color: colors.textMuted }]}>This stock is for your own tracking and does not list publicly in the marketplace.</Text>
          </View>

          {!isEdit ? (
            <TouchableOpacity
              onPress={() => navigation.navigate("CompanyProfile", { initialTab: "products" })}
              activeOpacity={0.85}
              style={[
                styles.pickerButton,
                {
                  borderColor: colors.primary,
                  backgroundColor: colors.primary + "10",
                  borderRadius: radius.md,
                  marginBottom: spacing.md,
                },
              ]}
            >
              <Ionicons name="cube-outline" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.pickerButtonTitle, { color: colors.primary }]}>Manage stock for my Listed products</Text>
                <Text style={[styles.pickerButtonSubtitle, { color: colors.textMuted }]}>Adjust stock for products you already list</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          ) : null}

          <InputField
            label="Item Name"
            required
            value={form.name}
            onChangeText={(v) => updateField("name", v)}
            placeholder="Enter non listed products"
            errorText={errors.name}
          />

          <InputField
            label="SKU"
            value={form.sku}
            onChangeText={(v) => updateField("sku", v.toUpperCase())}
            placeholder="Optional"
          />

          <InputField
            label="Category"
            required
            value={form.category}
            onChangeText={(v) => updateField("category", v)}
            placeholder="Example: Electrical, Packaging"
            errorText={errors.category}
          />

          <InputField
            label="Unit"
            required
            value={form.unit}
            onChangeText={(v) => updateField("unit", v)}
            placeholder="units, pcs, kg"
            errorText={errors.unit}
          />

          {!isEdit ? (
            <InputField
              label="On Hand Quantity"
              value={form.onHandQty}
              onChangeText={(v) => updateField("onHandQty", v)}
              placeholder="0"
              keyboardType="decimal-pad"
              errorText={errors.onHandQty}
              helperText="Initial quantity. Future changes should use stock adjust."
            />
          ) : (
            <InputField
              label="On Hand Quantity"
              value={form.onHandQty}
              editable={false}
              placeholder="0"
              helperText="Use stock adjust from inventory screen to change this quantity."
            />
          )}

          <InputField
            label="Reorder Level"
            value={form.reorderLevel}
            onChangeText={(v) => updateField("reorderLevel", v)}
            placeholder="0"
            keyboardType="decimal-pad"
            errorText={errors.reorderLevel}
          />

          <InputField
            label="Average Cost (INR)"
            value={form.avgCost}
            onChangeText={(v) => updateField("avgCost", v)}
            placeholder="0"
            keyboardType="decimal-pad"
            errorText={errors.avgCost}
          />

        </ScrollView>
        <View style={[styles.footer, { paddingHorizontal: spacing.lg, borderTopColor: colors.border }]}>
          <Button label={isEdit ? "Save changes" : "Create item"} onPress={handleSave} loading={loading} />
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={[styles.pickerBackdrop]}>
          <View style={[styles.pickerSheet, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>Pick a catalog product</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.pickerSearchWrap, { borderColor: colors.border, backgroundColor: colors.background, borderRadius: radius.md }]}>
              <Ionicons name="search" size={16} color={colors.textMuted} />
              <TextInput
                value={pickerSearch}
                onChangeText={setPickerSearch}
                placeholder="Search products by name, SKU, category"
                placeholderTextColor={colors.textMuted}
                style={[styles.pickerSearchInput, { color: colors.text }]}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {pickerSearch ? (
                <TouchableOpacity onPress={() => setPickerSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {pickerLoading ? (
              <View style={styles.pickerCentered}>
                <ActivityIndicator color={colors.primary} />
                <Text style={{ color: colors.textMuted, marginTop: 8, fontWeight: "600" }}>Loading products…</Text>
              </View>
            ) : pickerError ? (
              <View style={styles.pickerCentered}>
                <Text style={{ color: colors.error, fontWeight: "700", marginBottom: 8 }}>{pickerError}</Text>
                <TouchableOpacity onPress={loadPickerProducts}>
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : filteredPickerProducts.length === 0 ? (
              <View style={styles.pickerCentered}>
                <Text style={{ color: colors.textMuted, fontWeight: "600" }}>
                  {pickerSearch ? "No products match your search." : "No catalog products found. Add one first."}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredPickerProducts}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => selectPickerProduct(item)}
                    activeOpacity={0.85}
                    style={[styles.pickerRow, { borderBottomColor: colors.border }]}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.pickerRowTitle, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                        {item.name}
                      </Text>
                      <Text style={[styles.pickerRowMeta, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
                        {[item.sku, item.category].filter(Boolean).join(" · ") || "No SKU"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  loaderText: {
    fontSize: 13,
    fontWeight: "600",
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerButtonTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  pickerButtonSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    maxHeight: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  pickerSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    padding: 0,
  },
  pickerCentered: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerRowTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  pickerRowMeta: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    minHeight: 44,
  },
  backButtonHit: {
    minWidth: 64,
    paddingVertical: 6,
    paddingRight: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: "700",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    marginHorizontal: 8,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: "700",
  },
  infoCard: {
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  infoText: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 12,
  },
});

export default InternalInventoryItemFormScreen;
