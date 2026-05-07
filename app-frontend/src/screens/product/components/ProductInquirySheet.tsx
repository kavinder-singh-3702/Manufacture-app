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

export type InquiryFormSubmit = {
  quantity?: number;
  location?: string;
  message?: string;
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
};

type Props = {
  visible: boolean;
  productName: string;
  variantLabel?: string;
  loading?: boolean;
  defaultContact?: { name?: string; phone?: string; email?: string };
  onClose: () => void;
  onSubmit: (payload: InquiryFormSubmit) => void;
};

export const ProductInquirySheet = ({
  visible,
  productName,
  variantLabel,
  loading = false,
  defaultContact,
  onClose,
  onSubmit,
}: Props) => {
  const { colors, spacing, radius } = useTheme();
  const styles = useMemo(() => createStyles(colors, spacing, radius), [colors, spacing, radius]);

  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [contactName, setContactName] = useState(defaultContact?.name || "");
  const [contactPhone, setContactPhone] = useState(defaultContact?.phone || "");
  const [contactEmail, setContactEmail] = useState(defaultContact?.email || "");

  useEffect(() => {
    if (!visible) return;
    setQuantity("");
    setLocation("");
    setMessage("");
    setContactName(defaultContact?.name || "");
    setContactPhone(defaultContact?.phone || "");
    setContactEmail(defaultContact?.email || "");
  }, [visible, defaultContact?.name, defaultContact?.phone, defaultContact?.email]);

  const submit = () => {
    const qty = quantity.trim() ? Number(quantity) : undefined;
    onSubmit({
      quantity: qty && Number.isFinite(qty) && qty > 0 ? qty : undefined,
      location: location.trim() || undefined,
      message: message.trim() || undefined,
      contact:
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
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardWrap}
        >
          <View style={styles.sheet}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={[styles.iconBadge, { backgroundColor: colors.primary + "18" }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.headerTextWrap}>
                  <Text style={styles.title}>Contact to Purchase</Text>
                  <Text style={styles.subtitle} numberOfLines={2}>
                    {productName}
                  </Text>
                  {variantLabel ? <Text style={styles.variantText}>{variantLabel}</Text> : null}
                </View>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Info strip */}
            <View style={[styles.infoStrip, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "28" }]}>
              <Ionicons name="information-circle-outline" size={14} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.primary }]}>
                All fields are optional. Admin will contact you directly.
              </Text>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={{ paddingBottom: spacing.md }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets
            >
              {/* Purchase details */}
              <Text style={styles.sectionLabel}>Purchase Details</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  value={quantity}
                  onChangeText={setQuantity}
                  style={styles.input}
                  placeholder="How many units? (optional)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Delivery Location</Text>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  style={styles.input}
                  placeholder="City, state or address (optional)"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Message</Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  style={[styles.input, styles.textArea]}
                  placeholder="Any specifications, timeline, or additional details (optional)"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Contact details */}
              <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Your Contact</Text>

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
                  placeholder="Email address"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading}>
                <Ionicons name="send-outline" size={15} color={colors.textOnPrimary} style={{ marginRight: 6 }} />
                <Text style={styles.submitBtnText}>{loading ? "Sending..." : "Send Request"}</Text>
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
      backgroundColor: "rgba(8, 10, 15, 0.65)",
      justifyContent: "flex-end",
    },
    keyboardWrap: {
      width: "100%",
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderColor: colors.border,
      maxHeight: "90%",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
      gap: spacing.sm,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: 4,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    headerLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    iconBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
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
    variantText: {
      marginTop: 2,
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },
    closeBtn: {
      padding: 4,
      marginTop: 2,
    },
    infoStrip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: radius.md,
      borderWidth: 1,
    },
    infoText: {
      flex: 1,
      fontSize: 12,
      fontWeight: "600",
    },
    scroll: {
      maxHeight: 440,
    },
    sectionLabel: {
      marginTop: 4,
      marginBottom: 2,
      fontSize: 12,
      fontWeight: "900",
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
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
      minHeight: 90,
    },
    actionRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 4,
    },
    cancelBtn: {
      flex: 1,
      minHeight: 48,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelBtnText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "800",
    },
    submitBtn: {
      flex: 1.4,
      minHeight: 48,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    submitBtnText: {
      color: colors.textOnPrimary,
      fontSize: 14,
      fontWeight: "900",
    },
  });
