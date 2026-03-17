import { useEffect, useMemo, useState } from "react";
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { Button } from "../../../components/common/Button";
import type { InternalInventoryItem, InternalStockMovementType } from "../../../services/internalInventory.service";

type Props = {
  visible: boolean;
  item: InternalInventoryItem | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: { movementType: InternalStockMovementType; quantity: number; unitCost?: number; note?: string }) => Promise<void>;
};

const MOVEMENT_OPTIONS: Array<{ key: InternalStockMovementType; label: string; hint: string }> = [
  { key: "in", label: "Stock In", hint: "Add quantity" },
  { key: "out", label: "Stock Out", hint: "Issue quantity" },
  { key: "adjust", label: "Adjust", hint: "Use + or -" },
];

export const InternalStockAdjustSheet = ({ visible, item, loading = false, onClose, onSubmit }: Props) => {
  const { colors, radius, spacing } = useTheme();

  const [movementType, setMovementType] = useState<InternalStockMovementType>("in");
  const [quantityInput, setQuantityInput] = useState("");
  const [unitCostInput, setUnitCostInput] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setMovementType("in");
    setQuantityInput("");
    setUnitCostInput(item?.avgCost ? String(item.avgCost) : "");
    setNote("");
    setError(null);
  }, [item?.avgCost, visible]);

  const isPositiveMode = movementType === "in";
  const showUnitCost = movementType !== "out";

  const parsedQuantity = useMemo(() => {
    const value = Number(quantityInput);
    return Number.isFinite(value) ? value : NaN;
  }, [quantityInput]);

  const parsedUnitCost = useMemo(() => {
    if (!unitCostInput.trim()) return undefined;
    const value = Number(unitCostInput);
    return Number.isFinite(value) ? value : undefined;
  }, [unitCostInput]);

  const handleSubmit = async () => {
    if (!item) return;

    if (!Number.isFinite(parsedQuantity) || parsedQuantity === 0) {
      setError("Enter a valid non-zero quantity.");
      return;
    }

    if ((movementType === "in" || movementType === "out") && parsedQuantity < 0) {
      setError("Use a positive quantity for stock in/out.");
      return;
    }

    if (parsedUnitCost !== undefined && parsedUnitCost < 0) {
      setError("Unit cost cannot be negative.");
      return;
    }

    setError(null);
    await onSubmit({
      movementType,
      quantity: parsedQuantity,
      unitCost: parsedUnitCost,
      note: note.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, { backgroundColor: colors.modalBackdrop }]}> 
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderTopLeftRadius: radius.lg,
                  borderTopRightRadius: radius.lg,
                  paddingHorizontal: spacing.md,
                  paddingTop: spacing.md,
                  paddingBottom: spacing.xl,
                },
              ]}
            >
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: colors.text }]}>Adjust Stock</Text>
                  <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
                    {item?.name || "Item"}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose}>
                  <Text style={[styles.closeText, { color: colors.primary }]}>Close</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.segmentRow}>
                {MOVEMENT_OPTIONS.map((option) => {
                  const active = movementType === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      onPress={() => setMovementType(option.key)}
                      activeOpacity={0.85}
                      style={[
                        styles.segmentOption,
                        {
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active ? colors.primary + "15" : colors.surface,
                          borderRadius: radius.md,
                        },
                      ]}
                    >
                      <Text style={[styles.segmentLabel, { color: active ? colors.primary : colors.text }]}>{option.label}</Text>
                      <Text style={[styles.segmentHint, { color: colors.textMuted }]}>{option.hint}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Quantity</Text>
                <TextInput
                  value={quantityInput}
                  onChangeText={setQuantityInput}
                  placeholder={isPositiveMode ? "e.g. 12" : movementType === "out" ? "e.g. 3" : "e.g. -2 or 5"}
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                  style={[
                    styles.input,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceElevated,
                      color: colors.text,
                      borderRadius: radius.md,
                    },
                  ]}
                />
              </View>

              {showUnitCost ? (
                <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Unit Cost (INR)</Text>
                  <TextInput
                    value={unitCostInput}
                    onChangeText={setUnitCostInput}
                    placeholder="Optional"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="decimal-pad"
                    style={[
                      styles.input,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceElevated,
                        color: colors.text,
                        borderRadius: radius.md,
                      },
                    ]}
                  />
                </View>
              ) : null}

              <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Note</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Reason for this adjustment"
                  placeholderTextColor={colors.textTertiary}
                  style={[
                    styles.input,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceElevated,
                      color: colors.text,
                      borderRadius: radius.md,
                    },
                  ]}
                />
              </View>

              {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

              <View style={[styles.actionRow, { marginTop: spacing.md }]}> 
                <Button label="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
                <Button label="Apply" onPress={handleSubmit} loading={loading} style={{ flex: 1 }} />
              </View>
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
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "600",
  },
  closeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  segmentRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  segmentOption: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  segmentHint: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: "600",
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
});
