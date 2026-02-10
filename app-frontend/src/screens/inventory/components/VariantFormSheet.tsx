import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../hooks/useTheme";
import { ProductVariant, ProductVariantStatus, ProductVariantUpsertInput } from "../../../services/productVariant.service";
import { VariantOptionEditor, VariantOptionRow } from "./VariantOptionEditor";

const toOptionRows = (options?: Record<string, unknown>): VariantOptionRow[] => {
  const entries = Object.entries(options || {})
    .map(([key, value]) => ({ key: String(key), value: value == null ? "" : String(value) }))
    .filter((row) => row.key.trim() || row.value.trim());
  return entries.length ? entries : [{ key: "", value: "" }];
};

export const VariantFormSheet = ({
  visible,
  variant,
  onClose,
  onSubmit,
  loading,
}: {
  visible: boolean;
  variant: ProductVariant | null;
  onClose: () => void;
  onSubmit: (payload: ProductVariantUpsertInput) => Promise<void>;
  loading?: boolean;
}) => {
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [priceAmount, setPriceAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [unit, setUnit] = useState("units");
  const [availableQuantity, setAvailableQuantity] = useState("0");
  const [minStockQuantity, setMinStockQuantity] = useState("0");
  const [status, setStatus] = useState<ProductVariantStatus>("active");
  const [optionsRows, setOptionsRows] = useState<VariantOptionRow[]>([{ key: "", value: "" }]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setTitle(variant?.title || "");
    setSku(variant?.sku || "");
    setBarcode(variant?.barcode || "");
    setPriceAmount(typeof variant?.price?.amount === "number" ? String(variant.price.amount) : "");
    setCurrency(variant?.price?.currency || "INR");
    setUnit(variant?.unit || variant?.price?.unit || "units");
    setAvailableQuantity(String(variant?.availableQuantity ?? 0));
    setMinStockQuantity(String(variant?.minStockQuantity ?? 0));
    setStatus(variant?.status || "active");
    setOptionsRows(toOptionRows((variant?.options as Record<string, unknown>) || {}));
    setError(null);
  }, [variant, visible]);

  const isEditing = Boolean(variant?._id);

  const optionsPayload = useMemo(() => {
    return optionsRows.reduce<Record<string, string>>((acc, row) => {
      const key = row.key.trim();
      const value = row.value.trim();
      if (!key || !value) return acc;
      acc[key] = value;
      return acc;
    }, {});
  }, [optionsRows]);

  const handleSubmit = async () => {
    if (!Object.keys(optionsPayload).length) {
      setError("At least one valid option is required (example: Size = 500ml).");
      return;
    }
    const parsedAvailable = Number(availableQuantity || 0);
    const parsedMin = Number(minStockQuantity || 0);
    const parsedPrice = Number(priceAmount);

    const payload: ProductVariantUpsertInput = {
      title: title.trim() || undefined,
      sku: sku.trim() || undefined,
      barcode: barcode.trim() || undefined,
      options: optionsPayload,
      minStockQuantity: Number.isFinite(parsedMin) ? Math.max(0, parsedMin) : 0,
      availableQuantity: Number.isFinite(parsedAvailable) ? Math.max(0, parsedAvailable) : 0,
      unit: unit.trim() || undefined,
      status,
      price:
        Number.isFinite(parsedPrice) && parsedPrice >= 0
          ? {
              amount: parsedPrice,
              currency: (currency || "INR").toUpperCase(),
              unit: unit.trim() || undefined,
            }
          : undefined,
    };

    setError(null);
    await onSubmit(payload);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, { backgroundColor: colors.modalBackdrop }]}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderTopLeftRadius: radius.xl,
                  borderTopRightRadius: radius.xl,
                  paddingBottom: insets.bottom + spacing.md,
                },
              ]}
            >
              <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text }]}>{isEditing ? "Edit Variant" : "Add Variant"}</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }} keyboardShouldPersistTaps="handled">
                {error ? (
                  <View style={[styles.errorBox, { borderColor: colors.error + "55", backgroundColor: colors.error + "14", borderRadius: radius.md }]}>
                    <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                  </View>
                ) : null}

                <Input label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Coconut 500ml" />
                <Input label="SKU" value={sku} onChangeText={setSku} placeholder="Variant SKU" />
                <Input label="Barcode" value={barcode} onChangeText={setBarcode} placeholder="Barcode (optional)" />

                <View style={styles.row}>
                  <Input label="Price" value={priceAmount} onChangeText={setPriceAmount} placeholder="0" keyboardType="decimal-pad" />
                  <Input label="Currency" value={currency} onChangeText={setCurrency} placeholder="INR" autoCapitalize="characters" />
                </View>

                <View style={styles.row}>
                  <Input label="Available Qty" value={availableQuantity} onChangeText={setAvailableQuantity} placeholder="0" keyboardType="number-pad" />
                  <Input label="Min Stock Qty" value={minStockQuantity} onChangeText={setMinStockQuantity} placeholder="0" keyboardType="number-pad" />
                </View>

                <Input label="Unit" value={unit} onChangeText={setUnit} placeholder="units" />

                <View>
                  <Text style={[styles.label, { color: colors.textMuted }]}>Status</Text>
                  <View style={[styles.statusRow, { marginTop: 8 }]}>
                    {(["active", "inactive", "archived"] as const).map((value) => {
                      const active = status === value;
                      return (
                        <TouchableOpacity
                          key={value}
                          onPress={() => setStatus(value)}
                          style={[
                            styles.statusPill,
                            {
                              borderRadius: radius.pill,
                              borderColor: active ? colors.primary : colors.border,
                              backgroundColor: active ? colors.primary + "1A" : colors.surface,
                            },
                          ]}
                        >
                          <Text style={[styles.statusText, { color: active ? colors.primary : colors.text }]}>{value}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View>
                  <Text style={[styles.label, { color: colors.textMuted }]}>Options (required)</Text>
                  <VariantOptionEditor rows={optionsRows} onChange={setOptionsRows} />
                </View>
              </ScrollView>

              <View style={[styles.footer, { paddingHorizontal: spacing.lg, borderTopColor: colors.border }]}>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={Boolean(loading)}
                  style={[styles.submitButton, { borderRadius: radius.md, backgroundColor: colors.primary }]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.textOnPrimary} />
                  ) : (
                    <Text style={[styles.submitText, { color: colors.textOnPrimary }]}>{isEditing ? "Save changes" : "Create variant"}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const Input = ({
  label,
  ...rest
}: React.ComponentProps<typeof TextInput> & { label: string }) => {
  const { colors, radius } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        {...rest}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopWidth: 1,
    maxHeight: "92%",
  },
  header: {
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 17,
    fontWeight: "900",
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
  },
  input: {
    height: 42,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
  },
  statusPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  submitButton: {
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    fontSize: 13,
    fontWeight: "900",
  },
  errorBox: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "700",
  },
});

