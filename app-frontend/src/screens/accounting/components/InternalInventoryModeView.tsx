import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../../hooks/useTheme";
import { internalInventoryService, type InternalInventoryDashboard, type InternalInventoryItem } from "../../../services/internalInventory.service";
import { InternalStockAdjustSheet } from "../../internalInventory/components/InternalStockAdjustSheet";
import { useToast } from "../../../components/ui/Toast";

type Props = {
  enabled: boolean;
  onAddItem: () => void;
  onOpenInventory: () => void;
};

const formatINR = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export const InternalInventoryModeView = ({ enabled, onAddItem, onOpenInventory }: Props) => {
  const { colors, spacing, radius } = useTheme();
  const { success: toastSuccess, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<InternalInventoryDashboard | null>(null);
  const [lowStockItems, setLowStockItems] = useState<InternalInventoryItem[]>([]);
  const [adjustSheet, setAdjustSheet] = useState<{ open: boolean; item: InternalInventoryItem | null }>({ open: false, item: null });
  const [adjusting, setAdjusting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      setError(null);

      const [dashboardResult, lowStockList] = await Promise.all([
        internalInventoryService.getDashboard(),
        internalInventoryService.listItems({ status: "low_stock", limit: 5, offset: 0, sort: "qtyAsc" }),
      ]);

      setDashboard(dashboardResult);
      setLowStockItems(lowStockList.items || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load internal inventory insights.");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      if (enabled) {
        fetchData();
      }
    }, [enabled, fetchData])
  );

  const handleAdjust = useCallback(
    async (payload: { movementType: "in" | "out" | "adjust"; quantity: number; unitCost?: number; note?: string }) => {
      if (!adjustSheet.item) return;
      try {
        setAdjusting(true);
        await internalInventoryService.adjustItem(adjustSheet.item._id, payload);
        setAdjustSheet({ open: false, item: null });
        toastSuccess("Stock updated", "Internal stock updated successfully.");
        await fetchData();
      } catch (err: any) {
        toastError("Update failed", err?.message || "Unable to update stock right now.");
      } finally {
        setAdjusting(false);
      }
    },
    [adjustSheet.item, fetchData, toastError, toastSuccess]
  );

  const metrics = useMemo(
    () => ({
      totalItems: dashboard?.totalItems || 0,
      totalQty: dashboard?.totalQuantity || 0,
      totalValue: dashboard?.totalValue || 0,
      low: dashboard?.lowStockCount || 0,
      out: dashboard?.outOfStockCount || 0,
    }),
    [dashboard]
  );

  if (!enabled) return null;

  if (loading) {
    return (
      <View style={[styles.centered, { paddingVertical: spacing.xl }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.centeredText, { color: colors.textMuted }]}>Loading internal stock...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={{ gap: spacing.md }}>
        <View
          style={[
            styles.card,
            {
              borderRadius: radius.lg,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              padding: spacing.md,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Internal Stock Overview</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Private inventory for analytics, planning, and operations.</Text>

          <View style={[styles.metricsGrid, { marginTop: spacing.md }]}> 
            <Metric label="Items" value={metrics.totalItems.toLocaleString("en-IN")} />
            <Metric label="Units" value={metrics.totalQty.toLocaleString("en-IN")} />
            <Metric label="Value" value={formatINR(metrics.totalValue)} />
            <Metric label="Low / Out" value={`${metrics.low} / ${metrics.out}`} warning />
          </View>

          <View style={[styles.actionsRow, { marginTop: spacing.md }]}> 
            <TouchableOpacity
              onPress={onAddItem}
              style={[styles.actionButton, { borderRadius: radius.md, backgroundColor: colors.primary }]}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={16} color={colors.textOnPrimary} />
              <Text style={[styles.actionText, { color: colors.textOnPrimary }]}>Add Internal Item</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onOpenInventory}
              style={[styles.actionButton, { borderRadius: radius.md, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
              activeOpacity={0.85}
            >
              <Ionicons name="list" size={16} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.text }]}>Open Inventory</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[
            styles.card,
            {
              borderRadius: radius.lg,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              padding: spacing.md,
            },
          ]}
        >
          <View style={styles.rowBetween}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Low Stock Queue</Text>
            <TouchableOpacity onPress={onOpenInventory}>
              <Text style={[styles.linkText, { color: colors.primary }]}>View all</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={[styles.inlineError, { borderColor: colors.error + "35", backgroundColor: colors.error + "10", borderRadius: radius.md }]}> 
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={[styles.inlineErrorText, { color: colors.error }]} numberOfLines={2}>
                {error}
              </Text>
              <TouchableOpacity onPress={fetchData}>
                <Text style={[styles.linkText, { color: colors.primary }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : lowStockItems.length ? (
            <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
              {lowStockItems.map((item) => (
                <View key={item._id} style={[styles.itemRow, { borderColor: colors.border, borderRadius: radius.md }]}> 
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemMeta, { color: colors.textMuted }]} numberOfLines={1}>
                      On hand {item.onHandQty} {item.unit} • Reorder {item.reorderLevel} {item.unit}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setAdjustSheet({ open: true, item })}
                    style={[styles.quickButton, { borderRadius: radius.md, borderColor: colors.primary, backgroundColor: colors.primary + "10" }]}
                  >
                    <Text style={[styles.quickButtonText, { color: colors.primary }]}>Add stock</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { borderRadius: radius.md, borderColor: colors.border, marginTop: spacing.sm }]}> 
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No low-stock items right now.</Text>
            </View>
          )}
        </View>
      </View>

      <InternalStockAdjustSheet
        visible={adjustSheet.open}
        item={adjustSheet.item}
        loading={adjusting}
        onClose={() => setAdjustSheet({ open: false, item: null })}
        onSubmit={handleAdjust}
      />
    </>
  );
};

const Metric = ({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) => {
  const { colors, radius } = useTheme();

  return (
    <View style={[styles.metricPill, { borderRadius: radius.md, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}> 
      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: warning ? colors.warning : colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  centeredText: {
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricPill: {
    minWidth: "48%",
    flexGrow: 1,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metricValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "800",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkText: {
    fontSize: 12,
    fontWeight: "700",
  },
  inlineError: {
    marginTop: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineErrorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  itemRow: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  itemMeta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
  quickButton: {
    borderWidth: 1,
    minHeight: 34,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    borderWidth: 1,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default InternalInventoryModeView;
