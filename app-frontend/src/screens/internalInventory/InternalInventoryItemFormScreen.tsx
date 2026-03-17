import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { RootStackParamList } from "../../navigation/types";
import { InputField } from "../../components/common/InputField";
import { Button } from "../../components/common/Button";
import { internalInventoryService } from "../../services/internalInventory.service";
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
        toastSuccess("Item updated", form.name || "Internal item saved");
      } else {
        await internalInventoryService.createItem(payload as any);
        toastSuccess("Item added", form.name || "Internal item created");
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

    Alert.alert("Delete item", "Remove this internal inventory item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await internalInventoryService.deleteItem(itemId);
            toastSuccess("Item deleted", "Internal item removed.");
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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{isEdit ? "Edit Internal Item" : "Add Internal Item"}</Text>
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
            <Text style={[styles.infoTitle, { color: colors.text }]}>Internal item only</Text>
            <Text style={[styles.infoText, { color: colors.textMuted }]}>This stock is for internal analytics and does not list publicly in marketplace.</Text>
          </View>

          <InputField
            label="Item Name"
            required
            value={form.name}
            onChangeText={(v) => updateField("name", v)}
            placeholder="Enter internal stock item"
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

          <View style={{ marginTop: spacing.md }}>
            <Button label={isEdit ? "Save changes" : "Create internal item"} onPress={handleSave} loading={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  backText: {
    fontSize: 14,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
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
});

export default InternalInventoryItemFormScreen;
