import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export type DateRange = {
  from?: string; // ISO date string
  to?: string;   // ISO date string
};

type DateRangePreset = {
  label: string;
  getValue: () => DateRange;
};

const PRESETS: DateRangePreset[] = [
  {
    label: "Today",
    getValue: () => {
      const today = new Date().toISOString().split("T")[0];
      return { from: today, to: today };
    },
  },
  {
    label: "This Week",
    getValue: () => {
      const today = new Date();
      const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
      const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      return {
        from: firstDay.toISOString().split("T")[0],
        to: lastDay.toISOString().split("T")[0],
      };
    },
  },
  {
    label: "This Month",
    getValue: () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        from: firstDay.toISOString().split("T")[0],
        to: lastDay.toISOString().split("T")[0],
      };
    },
  },
  {
    label: "Last Month",
    getValue: () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        from: firstDay.toISOString().split("T")[0],
        to: lastDay.toISOString().split("T")[0],
      };
    },
  },
  {
    label: "This Quarter",
    getValue: () => {
      const today = new Date();
      const quarter = Math.floor(today.getMonth() / 3);
      const firstDay = new Date(today.getFullYear(), quarter * 3, 1);
      const lastDay = new Date(today.getFullYear(), quarter * 3 + 3, 0);
      return {
        from: firstDay.toISOString().split("T")[0],
        to: lastDay.toISOString().split("T")[0],
      };
    },
  },
  {
    label: "This Year",
    getValue: () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), 0, 1);
      const lastDay = new Date(today.getFullYear(), 11, 31);
      return {
        from: firstDay.toISOString().split("T")[0],
        to: lastDay.toISOString().split("T")[0],
      };
    },
  },
  {
    label: "All Time",
    getValue: () => ({ from: undefined, to: undefined }),
  },
];

type DateRangePickerProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
  label?: string;
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  label = "Date Range",
}) => {
  const { colors, spacing, radius } = useTheme();
  const [showModal, setShowModal] = useState(false);

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDisplayText = (): string => {
    if (!value.from && !value.to) return "All Time";
    if (value.from === value.to) return formatDate(value.from);
    return `${formatDate(value.from)} - ${formatDate(value.to)}`;
  };

  const handlePresetSelect = (preset: DateRangePreset) => {
    const newRange = preset.getValue();
    onChange(newRange);
    setShowModal(false);
  };

  return (
    <View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.md,
          },
        ]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonIcon, { color: colors.primary }]}>📅</Text>
        <Text style={[styles.buttonText, { color: colors.text }]}>{getDisplayText()}</Text>
        <Text style={[styles.buttonArrow, { color: colors.textMuted }]}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Date Range</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={[styles.closeButton, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.presetsList}>
              {PRESETS.map((preset, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.presetItem,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderRadius: radius.md,
                    },
                  ]}
                  onPress={() => handlePresetSelect(preset)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetLabel, { color: colors.text }]}>{preset.label}</Text>
                  <Text style={[styles.presetArrow, { color: colors.textMuted }]}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  buttonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  buttonArrow: {
    fontSize: 12,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    fontSize: 24,
    fontWeight: "400",
  },
  presetsList: {
    padding: 16,
    gap: 8,
  },
  presetItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  presetLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  presetArrow: {
    fontSize: 20,
    fontWeight: "600",
  },
});
