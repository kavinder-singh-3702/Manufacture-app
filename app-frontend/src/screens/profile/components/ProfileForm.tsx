import { StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  helperText?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?:
    | "default"
    | "email-address"
    | "numeric"
    | "phone-pad"
    | "number-pad"
    | "numbers-and-punctuation";
};

export const FormField = ({
  label,
  value,
  onChangeText,
  helperText,
  multiline,
  numberOfLines,
  keyboardType,
}: FormFieldProps) => {
  const { colors } = useTheme();
  return (
    <View style={styles.formField}>
      <Text style={[styles.formLabel, { color: colors.muted }]}>{label}</Text>
      <TextInput
        style={[styles.formInput, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor="#9CA3AF"
      />
      {helperText ? <Text style={styles.formHelper}>{helperText}</Text> : null}
    </View>
  );
};

export const SwitchRow = ({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.switchRow}>
      <Text style={[styles.switchLabel, { color: colors.text }]}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
};

export const TagList = ({ items }: { items: string[] }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.tagWrap}>
      {items.map((item) => (
        <View key={item} style={[styles.tag, { borderColor: colors.border }]}>
          <Text style={{ fontWeight: "600", color: colors.text }}>{item}</Text>
        </View>
      ))}
    </View>
  );
};

export const StatusPill = ({
  label,
  tone = "default",
  style,
}: {
  label: string;
  tone?: "default" | "success" | "warning";
  style?: object;
}) => {
  const { colors, spacing } = useTheme();
  const background =
    tone === "success" ? "rgba(16, 185, 129, 0.12)" : tone === "warning" ? "rgba(249, 115, 22, 0.12)" : colors.background;
  const textColor = tone === "success" ? "#059669" : tone === "warning" ? "#EA580C" : colors.text;

  return (
    <View
      style={[
        {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: 999,
          backgroundColor: background,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 12, fontWeight: "600", color: textColor }}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  formHelper: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
});
