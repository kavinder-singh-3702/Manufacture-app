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

export type QuoteRequestFormSubmit = {
  quantity: number;
  requirements: string;
  targetPrice?: number;
  requiredBy?: string;
  buyerContact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
};

type QuoteRequestSheetProps = {
  visible: boolean;
  productName: string;
  variantLabel?: string;
  loading?: boolean;
  defaultContact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  onClose: () => void;
  onSubmit: (payload: QuoteRequestFormSubmit) => void;
};

export const QuoteRequestSheet = ({
  visible,
  productName,
  variantLabel,
  loading = false,
  defaultContact,
  onClose,
  onSubmit,
}: QuoteRequestSheetProps) => {
  const { colors, spacing, radius } = useTheme();
  const styles = useMemo(() => createStyles(colors, spacing, radius), [colors, spacing, radius]);

  const [quantity, setQuantity] = useState("1");
  const [requirements, setRequirements] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [requiredBy, setRequiredBy] = useState("");
  const [contactName, setContactName] = useState(defaultContact?.name || "");
  const [contactPhone, setContactPhone] = useState(defaultContact?.phone || "");
  const [contactEmail, setContactEmail] = useState(defaultContact?.email || "");
  const [errors, setErrors] = useState<{ quantity?: string; requirements?: string }>({});

  useEffect(() => {
    if (!visible) return;
    setQuantity("1");
    setRequirements("");
    setTargetPrice("");
    setRequiredBy("");
    setContactName(defaultContact?.name || "");
    setContactPhone(defaultContact?.phone || "");
    setContactEmail(defaultContact?.email || "");
    setErrors({});
  }, [defaultContact?.email, defaultContact?.name, defaultContact?.phone, visible]);

  const submit = () => {
    const nextErrors: { quantity?: string; requirements?: string } = {};
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      nextErrors.quantity = "Quantity must be greater than 0";
    }
    if (!requirements.trim()) {
      nextErrors.requirements = "Requirements are required";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const targetPriceValue = targetPrice.trim() ? Number(targetPrice) : undefined;

    onSubmit({
      quantity: qty,
      requirements: requirements.trim(),
      targetPrice: Number.isFinite(targetPriceValue as number) ? targetPriceValue : undefined,
      requiredBy: requiredBy.trim() || undefined,
      buyerContact:
        contactName.trim() || contactPhone.trim() || contactEmail.trim()
          ? {
              name: contactName.trim() || undefined,
              phone: contactPhone.trim() || undefined,
              email: contactEmail.trim() || undefined,
            }
          : undefined,
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
                <Text style={styles.title}>Request Quote</Text>
                <Text style={styles.subtitle} numberOfLines={2}>
                  {productName}
                </Text>
                {variantLabel ? <Text style={styles.variant}>{variantLabel}</Text> : null}
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={{ paddingBottom: spacing.md }}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Quantity *</Text>
                <TextInput
                  value={quantity}
                  onChangeText={setQuantity}
                  style={styles.input}
                  placeholder="Enter quantity"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                />
                {errors.quantity ? <Text style={styles.errorText}>{errors.quantity}</Text> : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Requirements *</Text>
                <TextInput
                  value={requirements}
                  onChangeText={setRequirements}
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe quantity breakups, quality needs, packaging, and any terms"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                {errors.requirements ? <Text style={styles.errorText}>{errors.requirements}</Text> : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Target Price (optional)</Text>
                <TextInput
                  value={targetPrice}
                  onChangeText={setTargetPrice}
                  style={styles.input}
                  placeholder="Example: 250"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Required By (optional)</Text>
                <TextInput
                  value={requiredBy}
                  onChangeText={setRequiredBy}
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.sectionTitle}>Buyer Contact (optional)</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  value={contactName}
                  onChangeText={setContactName}
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  style={styles.input}
                  placeholder="Phone number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={contactEmail}
                  onChangeText={setContactEmail}
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </ScrollView>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} disabled={loading}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={submit} disabled={loading}>
                <Text style={styles.primaryBtnText}>{loading ? "Submitting..." : "Submit Quote"}</Text>
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
      maxHeight: "88%",
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
    variant: {
      marginTop: 2,
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },
    scroll: {
      maxHeight: 460,
    },
    fieldGroup: {
      marginTop: 8,
      gap: 6,
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
      minHeight: 110,
    },
    sectionTitle: {
      marginTop: 14,
      fontSize: 13,
      fontWeight: "900",
      color: colors.text,
    },
    errorText: {
      color: colors.error,
      fontSize: 11,
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
