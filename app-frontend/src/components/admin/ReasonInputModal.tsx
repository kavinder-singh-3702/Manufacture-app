import { useMemo } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";

type ReasonInputModalProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  value: string;
  onChangeValue: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  loading?: boolean;
  error?: string | null;
  maxLength?: number;
};

export const ReasonInputModal = ({
  visible,
  title,
  subtitle,
  value,
  onChangeValue,
  onClose,
  onSubmit,
  submitLabel = "Submit",
  loading = false,
  error,
  maxLength = 300,
}: ReasonInputModalProps) => {
  const { colors, spacing, radius } = useTheme();
  const remaining = useMemo(() => Math.max(0, maxLength - value.length), [maxLength, value.length]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              margin: spacing.lg,
              padding: spacing.lg,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              {subtitle}
            </Text>
          ) : null}

          <TextInput
            style={[
              styles.textArea,
              {
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.background,
                marginTop: spacing.md,
                borderRadius: radius.md,
                padding: spacing.md,
              },
            ]}
            placeholder="Add a clear reason"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={value}
            onChangeText={onChangeValue}
            maxLength={maxLength}
            editable={!loading}
          />

          <View style={[styles.metaRow, { marginTop: spacing.xs }]}>
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              Required for audit history
            </Text>
            <Text style={[styles.helperText, { color: colors.textMuted }]}>{remaining} left</Text>
          </View>

          {error ? (
            <Text style={[styles.errorText, { color: colors.error, marginTop: spacing.sm }]}>{error}</Text>
          ) : null}

          <View style={[styles.buttonRow, { marginTop: spacing.lg, gap: spacing.sm }]}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.secondaryButton,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  borderRadius: radius.md,
                  paddingVertical: spacing.sm + 2,
                },
              ]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: colors.error,
                  borderRadius: radius.md,
                  paddingVertical: spacing.sm + 2,
                  opacity: loading ? 0.75 : 1,
                },
              ]}
              onPress={onSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>{submitLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    width: "100%",
    maxWidth: 520,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  helperText: {
    fontSize: 11,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  button: {
    flex: 1,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});

