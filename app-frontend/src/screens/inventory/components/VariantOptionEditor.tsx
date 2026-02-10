import React from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";

export type VariantOptionRow = {
  key: string;
  value: string;
};

export const VariantOptionEditor = ({
  rows,
  onChange,
}: {
  rows: VariantOptionRow[];
  onChange: (rows: VariantOptionRow[]) => void;
}) => {
  const { colors, radius } = useTheme();

  const updateRow = (index: number, patch: Partial<VariantOptionRow>) => {
    onChange(rows.map((row, idx) => (idx === index ? { ...row, ...patch } : row)));
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, idx) => idx !== index));
  };

  const addRow = () => {
    onChange([...rows, { key: "", value: "" }]);
  };

  return (
    <View style={{ gap: 8 }}>
      {rows.map((row, idx) => (
        <View key={`${idx}-${row.key}-${row.value}`} style={styles.row}>
          <TextInput
            value={row.key}
            onChangeText={(text) => updateRow(idx, { key: text })}
            placeholder="Option name (e.g. Size)"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md }]}
          />
          <TextInput
            value={row.value}
            onChangeText={(text) => updateRow(idx, { value: text })}
            placeholder="Option value (e.g. 500ml)"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md }]}
          />
          <TouchableOpacity
            onPress={() => removeRow(idx)}
            style={[styles.removeBtn, { borderColor: colors.error + "55", borderRadius: radius.md }]}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        onPress={addRow}
        style={[styles.addBtn, { borderColor: colors.primary, borderRadius: radius.md }]}
      >
        <Ionicons name="add" size={16} color={colors.primary} />
        <Text style={[styles.addText, { color: colors.primary }]}>Add option</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    height: 42,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: "600",
  },
  removeBtn: {
    width: 40,
    height: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  addText: {
    fontSize: 12,
    fontWeight: "800",
  },
});

