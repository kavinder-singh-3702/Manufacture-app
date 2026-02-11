import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import type { Quote, RespondQuotePayload } from "../../../services/quote.service";

type QuoteResponseSheetProps = {
  visible: boolean;
  quote: Quote | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: RespondQuotePayload) => void;
};

export const QuoteResponseSheet = ({
  visible,
  quote,
  loading = false,
  onClose,
  onSubmit,
}: QuoteResponseSheetProps) => {
  const { colors, spacing, radius } = useTheme();
  const styles = useMemo(() => createStyles(colors, spacing, radius), [colors, spacing, radius]);

  const [unitPrice, setUnitPrice] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [minOrderQty, setMinOrderQty] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setUnitPrice(quote?.response?.unitPrice !== undefined ? String(quote.response.unitPrice) : "");
    setCurrency(quote?.response?.currency || quote?.request?.currency || "INR");
    setMinOrderQty(quote?.response?.minOrderQty !== undefined ? String(quote.response.minOrderQty) : "");
    setLeadTimeDays(quote?.response?.leadTimeDays !== undefined ? String(quote.response.leadTimeDays) : "");
    setValidUntil(quote?.response?.validUntil ? String(quote.response.validUntil).slice(0, 10) : "");
    setNotes(quote?.response?.notes || "");
    setError(null);
  }, [quote, visible]);

  const submit = () => {
    const parsedUnitPrice = Number(unitPrice);
    if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice < 0) {
      setError("Unit price is required");
      return;
    }

    setError(null);

    onSubmit({
      unitPrice: parsedUnitPrice,
      currency: currency.trim().toUpperCase() || "INR",
      minOrderQty: minOrderQty.trim() ? Number(minOrderQty) : undefined,
      leadTimeDays: leadTimeDays.trim() ? Number(leadTimeDays) : undefined,
      validUntil: validUntil.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardWrap}
        >
          <View style={styles.sheet}>
            <View style={styles.headerRow}>
              <View style={styles.headerTextWrap}>
                <Text style={styles.title}>Respond to Quote</Text>
                <Text style={styles.subtitle} numberOfLines={2}>
                  {quote?.product?.name || "Quote"}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Unit Price *</Text>
                <TextInput
                  value={unitPrice}
                  onChangeText={setUnitPrice}
                  style={styles.input}
                  placeholder="Enter unit price"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Currency</Text>
                <TextInput
                  value={currency}
                  onChangeText={setCurrency}
                  style={styles.input}
                  placeholder="INR"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.rowTwo}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Min Order Qty</Text>
                  <TextInput
                    value={minOrderQty}
                    onChangeText={setMinOrderQty}
                    style={styles.input}
                    placeholder="Optional"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Lead Time (days)</Text>
                  <TextInput
                    value={leadTimeDays}
                    onChangeText={setLeadTimeDays}
                    style={styles.input}
                    placeholder="Optional"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Valid Until</Text>
                <TextInput
                  value={validUntil}
                  onChangeText={setValidUntil}
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  style={[styles.input, styles.textArea]}
                  placeholder="Delivery assumptions, payment terms, inclusions"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </ScrollView>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} disabled={loading}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={submit} disabled={loading}>
                <Text style={styles.primaryBtnText}>{loading ? "Saving..." : "Send Quote"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const createStyles = (
  colors: ReturnType<typeof useTheme>["colors"],
  spacing: ReturnType<typeof useTheme>["spacing"],
  radius: ReturnType<typeof useTheme>["radius"]
) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(8, 10, 15, 0.6)",
      justifyContent: "flex-end",
    },
    keyboardWrap: {
      width: "100%",
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      borderTopWidth: 1,
      borderColor: colors.border,
      maxHeight: "86%",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    headerTextWrap: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: 17,
      fontWeight: "900",
      color: colors.text,
    },
    subtitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    scroll: {
      maxHeight: 420,
    },
    fieldGroup: {
      marginTop: 8,
      gap: 6,
    },
    rowTwo: {
      flexDirection: "row",
      gap: 10,
    },
    label: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      color: colors.text,
      borderRadius: radius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
      fontWeight: "600",
      minHeight: 44,
    },
    textArea: {
      minHeight: 100,
    },
    errorText: {
      marginTop: 10,
      color: colors.error,
      fontSize: 12,
      fontWeight: "700",
    },
    actionRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 6,
    },
    secondaryBtn: {
      flex: 1,
      minHeight: 44,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
    },
    secondaryBtnText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "800",
    },
    primaryBtn: {
      flex: 1.2,
      minHeight: 44,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryBtnText: {
      color: colors.textOnPrimary,
      fontSize: 13,
      fontWeight: "900",
    },
  });
