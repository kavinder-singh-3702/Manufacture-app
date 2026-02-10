import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { useToast } from "../../../components/ui/Toast";
import { productService, type Product } from "../../../services/product.service";
import { ProductVariant, productVariantService } from "../../../services/productVariant.service";
import { syncProductFromVariants, variantDisplayLabel } from "./variantDomain";

type Mode = "add" | "remove";

const clampInt = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
};

export const QuickAdjustStockSheet = ({
  visible,
  product,
  variant,
  suggestedQty,
  initialMode = "add",
  onClose,
  onSaved,
}: {
  visible: boolean;
  product: Product | null;
  variant?: ProductVariant | null;
  suggestedQty?: number;
  initialMode?: Mode;
  onClose: () => void;
  onSaved?: () => void;
}) => {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { success: toastSuccess, error: toastError } = useToast();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [qtyText, setQtyText] = useState("1");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const s = typeof suggestedQty === "number" && suggestedQty > 0 ? suggestedQty : 1;
    setMode(initialMode);
    setQtyText(String(clampInt(s, 1, 999999)));
  }, [initialMode, suggestedQty, visible]);

  const qty = useMemo(() => {
    const parsed = parseInt(qtyText, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [qtyText]);

  const adjustment = useMemo(() => (mode === "add" ? qty : -qty), [mode, qty]);

  const projectedStock = useMemo(() => {
    if (!product) return null;
    const current = Number(variant ? variant.availableQuantity : product.availableQuantity || 0);
    if (!Number.isFinite(current)) return null;
    return Math.max(0, current + adjustment);
  }, [adjustment, product, variant]);

  const bump = useCallback((delta: number) => {
    setQtyText((prev) => {
      const parsed = parseInt(prev || "0", 10);
      const next = clampInt((Number.isFinite(parsed) ? parsed : 0) + delta, 1, 999999);
      return String(next);
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!product) return;
    if (!qty || qty <= 0) {
      toastError("Invalid quantity", "Enter a quantity greater than 0.");
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      if (variant?._id) {
        await productVariantService.adjustQuantity(product._id, variant._id, adjustment);
        await syncProductFromVariants(product._id, "company");
        toastSuccess("Variant stock updated", variantDisplayLabel(variant));
      } else {
        await productService.adjustQuantity(product._id, adjustment);
        toastSuccess("Stock updated", product.name);
      }
      onClose();
      onSaved?.();
    } catch (err: any) {
      toastError("Update failed", err?.message || "Could not update stock.");
    } finally {
      setSaving(false);
    }
  }, [adjustment, onClose, onSaved, product, qty, saving, toastError, toastSuccess, variant]);

  const disabled = !product;

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
                  paddingHorizontal: spacing.lg,
                  paddingTop: spacing.lg,
                  paddingBottom: spacing.lg + insets.bottom,
                },
              ]}
            >
              <View style={styles.header}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.title, { color: colors.textOnLightSurface }]}>Quick Adjust</Text>
                  <Text style={[styles.subtitle, { color: colors.subtextOnLightSurface }]} numberOfLines={2}>
                    {variant ? `${product?.name || "Product"} • ${variantDisplayLabel(variant)}` : product?.name || "Select a product"}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} activeOpacity={0.8} hitSlop={10}>
                  <Ionicons name="close" size={22} color={colors.subtextOnLightSurface} />
                </TouchableOpacity>
              </View>

              {/* Mode toggle */}
              <View style={[styles.modeToggle, { backgroundColor: colors.surfaceElevated, borderRadius: radius.pill }]}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setMode("add")}
                  style={[
                    styles.modeOption,
                    {
                      backgroundColor: mode === "add" ? colors.surface : "transparent",
                      borderRadius: radius.pill,
                      borderColor: mode === "add" ? colors.border : "transparent",
                    },
                  ]}
                >
                  <Ionicons name="add" size={16} color={mode === "add" ? colors.success : colors.subtextOnLightSurface} />
                  <Text style={[styles.modeText, { color: mode === "add" ? colors.textOnLightSurface : colors.subtextOnLightSurface }]}>
                    Add
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setMode("remove")}
                  style={[
                    styles.modeOption,
                    {
                      backgroundColor: mode === "remove" ? colors.surface : "transparent",
                      borderRadius: radius.pill,
                      borderColor: mode === "remove" ? colors.border : "transparent",
                    },
                  ]}
                >
                  <Ionicons name="remove" size={16} color={mode === "remove" ? colors.error : colors.subtextOnLightSurface} />
                  <Text style={[styles.modeText, { color: mode === "remove" ? colors.textOnLightSurface : colors.subtextOnLightSurface }]}>
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Quantity input */}
              <View style={{ marginTop: spacing.md }}>
                <Text style={[styles.fieldLabel, { color: colors.subtextOnLightSurface }]}>Quantity</Text>
                <View style={[styles.qtyRow, { borderRadius: radius.lg, borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <TouchableOpacity
                    onPress={() => bump(-1)}
                    disabled={disabled}
                    activeOpacity={0.85}
                    style={styles.qtyButton}
                  >
                    <Ionicons name="remove" size={20} color={colors.subtextOnLightSurface} />
                  </TouchableOpacity>
                  <TextInput
                    value={qtyText}
                    onChangeText={(t) => setQtyText(t.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.subtextOnLightSurface}
                    style={[styles.qtyInput, { color: colors.textOnLightSurface }]}
                    editable={!disabled}
                  />
                  <TouchableOpacity
                    onPress={() => bump(1)}
                    disabled={disabled}
                    activeOpacity={0.85}
                    style={styles.qtyButton}
                  >
                    <Ionicons name="add" size={20} color={colors.subtextOnLightSurface} />
                  </TouchableOpacity>
                </View>

                <View style={styles.stepperRow}>
                  {[1, 5, 10].map((n) => (
                    <TouchableOpacity
                      key={n}
                      activeOpacity={0.85}
                      onPress={() => bump(n)}
                      disabled={disabled}
                      style={[styles.stepPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderRadius: radius.pill }]}
                    >
                      <Text style={[styles.stepPillText, { color: colors.textOnLightSurface }]}>+{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {product ? (
                  <View style={[styles.previewRow, { backgroundColor: colors.surfaceElevated, borderRadius: radius.lg, borderColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.previewLabel, { color: colors.subtextOnLightSurface }]}>Current</Text>
                      <Text style={[styles.previewValue, { color: colors.textOnLightSurface }]}>
                        {Number(variant ? variant.availableQuantity : product.availableQuantity || 0).toLocaleString("en-IN")}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.previewLabel, { color: colors.subtextOnLightSurface }]}>After</Text>
                      <Text style={[styles.previewValue, { color: colors.textOnLightSurface }]}>{projectedStock?.toLocaleString("en-IN") ?? "—"}</Text>
                    </View>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                disabled={disabled || saving}
                onPress={handleSave}
                style={[
                  styles.saveButton,
                  {
                    marginTop: spacing.lg,
                    borderRadius: radius.lg,
                    backgroundColor: disabled ? colors.buttonSecondary : colors.primary,
                  },
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color={colors.textOnPrimary} />
                    <Text style={[styles.saveButtonText, { color: colors.textOnPrimary }]}>Save adjustment</Text>
                  </>
                )}
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: { borderTopWidth: 1 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  title: { fontSize: 18, fontWeight: "900", letterSpacing: -0.2 },
  subtitle: { fontSize: 12, fontWeight: "700" },
  modeToggle: { flexDirection: "row", padding: 6, marginTop: 14 },
  modeOption: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderWidth: 1 },
  modeText: { fontSize: 12, fontWeight: "900" },
  fieldLabel: { fontSize: 12, fontWeight: "800", marginBottom: 8 },
  qtyRow: { flexDirection: "row", alignItems: "center", borderWidth: 1 },
  qtyButton: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  qtyInput: { flex: 1, fontSize: 18, fontWeight: "900", textAlign: "center", paddingVertical: 14 },
  stepperRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  stepPill: { paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1 },
  stepPillText: { fontSize: 12, fontWeight: "900" },
  previewRow: { marginTop: 14, borderWidth: 1, padding: 12, flexDirection: "row", gap: 10 },
  previewLabel: { fontSize: 11, fontWeight: "800" },
  previewValue: { fontSize: 16, fontWeight: "900", marginTop: 2 },
  saveButton: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  saveButtonText: { fontSize: 13, fontWeight: "900" },
});
