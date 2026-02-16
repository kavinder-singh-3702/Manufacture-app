import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { ProductVariant } from "../../../services/productVariant.service";
import { variantDisplayLabel } from "./variantDomain";

const optionLabel = (variant: ProductVariant) => {
  const entries = Object.entries((variant.options || {}) as Record<string, unknown>);
  if (!entries.length) return variantDisplayLabel(variant);
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(" • ");
};

export const VariantCardRow = ({
  variant,
  onEdit,
  onDelete,
  onAdjust,
}: {
  variant: ProductVariant;
  onEdit: () => void;
  onDelete: () => void;
  onAdjust: (delta: number) => void;
}) => {
  const { colors, radius } = useTheme();
  const stock = Number(variant.availableQuantity || 0);
  const minStock = Number(variant.minStockQuantity || 0);
  const stockStatus = stock <= 0 ? "Out" : stock <= minStock ? "Low" : "In";
  const stockColor = stock <= 0 ? colors.error : stock <= minStock ? colors.warning : colors.success;

  return (
    <View style={[styles.card, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface }]}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
            {variantDisplayLabel(variant)}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={2}>
            {optionLabel(variant)}
          </Text>
        </View>
        <View style={[styles.stockBadge, { borderColor: stockColor + "66", backgroundColor: stockColor + "1A", borderRadius: radius.pill }]}>
          <Text style={[styles.stockText, { color: stockColor }]}>{stockStatus}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          Price: {variant.price?.currency || "INR"} {Number(variant.price?.amount || 0).toLocaleString("en-IN")}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>Qty: {stock}</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={onEdit} style={[styles.actionBtn, { borderColor: colors.border, borderRadius: radius.sm }]}>
          <Ionicons name="create-outline" size={14} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onAdjust(-1)} style={[styles.actionBtn, { borderColor: colors.border, borderRadius: radius.sm }]}>
          <Ionicons name="remove-outline" size={14} color={colors.text} />
          <Text style={[styles.actionText, { color: colors.text }]}>-1</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onAdjust(1)} style={[styles.actionBtn, { borderColor: colors.border, borderRadius: radius.sm }]}>
          <Ionicons name="add-outline" size={14} color={colors.text} />
          <Text style={[styles.actionText, { color: colors.text }]}>+1</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onDelete} style={[styles.actionBtn, { borderColor: colors.error + "55", borderRadius: radius.sm }]}>
          <Ionicons name="trash-outline" size={14} color={colors.error} />
          <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  stockBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stockText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  meta: {
    fontSize: 12,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  actionBtn: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "800",
  },
});
