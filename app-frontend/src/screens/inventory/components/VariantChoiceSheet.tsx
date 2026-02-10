import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../hooks/useTheme";
import { Product, ProductListScope } from "../../../services/product.service";
import { ProductVariant } from "../../../services/productVariant.service";
import { listAllVariants, variantDisplayLabel } from "./variantDomain";

export type VariantChoiceSelection =
  | {
      mode: "base";
      product: Product;
    }
  | {
      mode: "variant";
      product: Product;
      variant: ProductVariant;
    };

export const VariantChoiceSheet = ({
  visible,
  product,
  scope = "company",
  title = "Select how to continue",
  subtitle = "This product has variants. You can continue with the base product or choose a specific variant.",
  baseActionLabel = "Continue with base product",
  onClose,
  onSelect,
}: {
  visible: boolean;
  product: Product | null;
  scope?: ProductListScope;
  title?: string;
  subtitle?: string;
  baseActionLabel?: string;
  onClose: () => void;
  onSelect: (selection: VariantChoiceSelection) => void | Promise<void>;
}) => {
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [error, setError] = useState<string | null>(null);

  const activeVariants = useMemo(
    () => variants.filter((variant) => variant.status === "active"),
    [variants]
  );

  const loadVariants = useCallback(async () => {
    if (!product || !visible) return;
    try {
      setLoading(true);
      setError(null);
      const items = await listAllVariants(product._id, scope);
      setVariants(items);
    } catch (err: any) {
      setError(err?.message || "Failed to load variants");
      setVariants([]);
    } finally {
      setLoading(false);
    }
  }, [product, scope, visible]);

  useEffect(() => {
    if (!visible) {
      setVariants([]);
      setError(null);
      setLoading(false);
      setSubmitting(false);
      return;
    }
    loadVariants();
  }, [loadVariants, visible]);

  const handleSelectBase = useCallback(async () => {
    if (!product || submitting) return;
    try {
      setSubmitting(true);
      await onSelect({ mode: "base", product });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }, [onClose, onSelect, product, submitting]);

  const handleSelectVariant = useCallback(
    async (variant: ProductVariant) => {
      if (!product || submitting) return;
      try {
        setSubmitting(true);
        await onSelect({ mode: "variant", product, variant });
        onClose();
      } finally {
        setSubmitting(false);
      }
    },
    [onClose, onSelect, product, submitting]
  );

  const renderPrice = (variant: ProductVariant) => {
    const amount = Number(variant.price?.amount || product?.price?.amount || 0);
    const currency = variant.price?.currency || product?.price?.currency || "INR";
    const symbol = currency === "INR" ? "₹" : `${currency} `;
    return `${symbol}${amount.toLocaleString("en-IN")}`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, { backgroundColor: colors.modalBackdrop }]}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.surface,
                  borderTopLeftRadius: radius.xl,
                  borderTopRightRadius: radius.xl,
                  borderColor: colors.border,
                  paddingBottom: insets.bottom + spacing.md,
                },
              ]}
            >
              <View style={[styles.header, { borderBottomColor: colors.border, padding: spacing.lg }]}> 
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={10}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md }}
                keyboardShouldPersistTaps="handled"
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  disabled={submitting}
                  onPress={handleSelectBase}
                  style={[
                    styles.baseAction,
                    {
                      borderColor: colors.border,
                      borderRadius: radius.lg,
                      backgroundColor: colors.surfaceElevated,
                    },
                  ]}
                >
                  <View style={[styles.baseIcon, { backgroundColor: colors.primary + "1A" }]}>
                    <Ionicons name="cube-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.baseTitle, { color: colors.text }]}>{baseActionLabel}</Text>
                    <Text style={[styles.baseSubtitle, { color: colors.textMuted }]} numberOfLines={2}>
                      Uses the product-level stock and price.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                <View style={styles.listHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose specific variant</Text>
                  <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
                    {activeVariants.length} options
                  </Text>
                </View>

                {loading ? (
                  <View style={styles.centerWrap}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading variants...</Text>
                  </View>
                ) : error ? (
                  <View
                    style={[
                      styles.errorCard,
                      {
                        borderRadius: radius.md,
                        borderColor: colors.error + "66",
                        backgroundColor: colors.error + "14",
                      },
                    ]}
                  >
                    <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                    <TouchableOpacity onPress={loadVariants}>
                      <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : activeVariants.length === 0 ? (
                  <View
                    style={[
                      styles.emptyCard,
                      {
                        borderRadius: radius.md,
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceElevated,
                      },
                    ]}
                  >
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No active variants</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Continue with base product.</Text>
                  </View>
                ) : (
                  activeVariants.map((variant) => {
                    const stock = Number(variant.availableQuantity || 0);
                    return (
                      <TouchableOpacity
                        key={variant._id}
                        disabled={submitting}
                        activeOpacity={0.9}
                        onPress={() => handleSelectVariant(variant)}
                        style={[
                          styles.variantRow,
                          {
                            borderColor: colors.border,
                            borderRadius: radius.md,
                            backgroundColor: colors.surfaceElevated,
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.variantTitle, { color: colors.text }]} numberOfLines={2}>
                            {variantDisplayLabel(variant)}
                          </Text>
                          <Text style={[styles.variantMeta, { color: colors.textMuted }]}>SKU: {variant.sku || "—"}</Text>
                          <Text style={[styles.variantMeta, { color: colors.textMuted }]}>Price: {renderPrice(variant)}</Text>
                        </View>
                        <View style={{ alignItems: "flex-end", gap: 6 }}>
                          <View
                            style={[
                              styles.stockBadge,
                              {
                                borderColor: (stock > 0 ? colors.success : colors.error) + "55",
                                backgroundColor: (stock > 0 ? colors.success : colors.error) + "15",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.stockBadgeText,
                                {
                                  color: stock > 0 ? colors.success : colors.error,
                                },
                              ]}
                            >
                              {stock > 0 ? `Stock ${stock}` : "Out"}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "92%",
    borderTopWidth: 1,
  },
  header: {
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  baseAction: {
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  baseIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  baseTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  baseSubtitle: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "600",
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: "700",
  },
  centerWrap: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: "700",
  },
  errorCard: {
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  retryText: {
    fontSize: 12,
    fontWeight: "800",
  },
  emptyCard: {
    borderWidth: 1,
    padding: 12,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  variantRow: {
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  variantTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  variantMeta: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
  },
  stockBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: "900",
  },
});

export default VariantChoiceSheet;
