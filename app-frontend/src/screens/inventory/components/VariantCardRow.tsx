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
  readOnly = false,
}: {
  variant: ProductVariant;
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}) => {
  const { colors, radius } = useTheme();

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
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          Price: {variant.price?.currency || "INR"} {Number(variant.price?.amount || 0).toLocaleString("en-IN")}
          {variant.price?.unit ? ` / ${variant.price.unit}` : ""}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>Status: {variant.status}</Text>
      </View>

      {readOnly && (
        <View style={[styles.detailsGrid, { borderColor: colors.border }]}>
          {variant.sku ? (
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>SKU</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{variant.sku}</Text>
            </View>
          ) : null}
          {variant.barcode ? (
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Barcode</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{variant.barcode}</Text>
            </View>
          ) : null}
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Available Stock</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {variant.availableQuantity ?? 0}{variant.unit ? ` ${variant.unit}` : ""}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Min Stock</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {variant.minStockQuantity ?? 0}{variant.unit ? ` ${variant.unit}` : ""}
            </Text>
          </View>
          {variant.attributes && Object.keys(variant.attributes).length > 0 ? (
            <View style={[styles.detailItem, { flexBasis: "100%" }]}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Attributes</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {Object.entries(variant.attributes).map(([k, v]) => `${k}: ${String(v)}`).join(" • ")}
              </Text>
            </View>
          ) : null}
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Created</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {new Date(variant.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Updated</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {new Date(variant.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </Text>
          </View>
        </View>
      )}

      {!readOnly && (
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={onEdit} style={[styles.actionBtn, { borderColor: colors.border, borderRadius: radius.sm }]}>
            <Ionicons name="create-outline" size={14} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onDelete} style={[styles.actionBtn, { borderColor: colors.error + "55", borderRadius: radius.sm }]}>
            <Ionicons name="trash-outline" size={14} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
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
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  meta: {
    fontSize: 12,
    fontWeight: "700",
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  detailItem: {
    flexBasis: "46%",
    gap: 2,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
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
