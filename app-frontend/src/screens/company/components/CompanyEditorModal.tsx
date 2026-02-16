import { KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { BUSINESS_ACCOUNT_TYPES } from "../../../constants/business";
import { Button } from "../../../components/common/Button";
import { useTheme } from "../../../hooks/useTheme";
import { useResponsiveLayout } from "../../../hooks/useResponsiveLayout";
import { AdaptiveSingleLineText } from "../../../components/text/AdaptiveSingleLineText";
import { AdaptiveTwoLineText } from "../../../components/text/AdaptiveTwoLineText";
import { CompanyEditorSection, CompanyProfileFormState } from "./types";
import { useCompanyProfileLayout } from "./companyProfile.layout";

type Props = {
  visible: boolean;
  section: CompanyEditorSection;
  form: CompanyProfileFormState;
  onChange: (changes: Partial<CompanyProfileFormState>) => void;
  onClose: () => void;
  onSubmit: () => void;
  saving: boolean;
};

export const CompanyEditorModal = ({ visible, section, form, onChange, onClose, onSubmit, saving }: Props) => {
  const { colors, spacing, radius } = useTheme();
  const { isCompact } = useResponsiveLayout();
  const layout = useCompanyProfileLayout();

  if (!section) return null;

  const title = section === "overview" ? "Edit overview" : section === "contact" ? "Edit contact" : "Edit address";

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View
            style={[
              styles.modalHeader,
              {
                paddingHorizontal: layout.edgePadding,
                minHeight: layout.headerHeight,
                borderBottomColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { minHeight: layout.chipHeight }]}> 
              <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.modalClose, { color: colors.text }]}>Close</AdaptiveSingleLineText>
            </TouchableOpacity>
            <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.modalTitle, { color: colors.text, fontSize: layout.titleSize }]}> 
              {title}
            </AdaptiveSingleLineText>
            <View style={{ width: isCompact ? 50 : 64 }} />
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: layout.edgePadding,
              paddingTop: spacing.md,
              paddingBottom: spacing.xl,
            }}
          >
            {section === "overview" ? (
              <>
                <Field label="Display name" value={form.displayName} onChangeText={(value) => onChange({ displayName: value })} />
                <Field label="Legal name" value={form.legalName} onChangeText={(value) => onChange({ legalName: value })} />
                <Field label="Description" value={form.description} onChangeText={(value) => onChange({ description: value })} multiline numberOfLines={4} />
                <Field label="Logo URL" value={form.logoUrl} onChangeText={(value) => onChange({ logoUrl: value })} />
                <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.label, { color: colors.muted }]}>Type</AdaptiveSingleLineText>
                <View style={[styles.segmentRow, { gap: isCompact ? 6 : 8 }]}> 
                  {BUSINESS_ACCOUNT_TYPES.map((type) => {
                    const active = form.type === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => onChange({ type })}
                        style={[
                          styles.segmentButton,
                          {
                            borderColor: active ? colors.primary : colors.border,
                            backgroundColor: active ? colors.primaryLight : colors.surface,
                            minHeight: layout.chipHeight,
                            paddingHorizontal: isCompact ? 10 : 14,
                          },
                        ]}
                      >
                        <AdaptiveSingleLineText
                          allowOverflowScroll={false}
                          minimumFontScale={0.75}
                          style={{ color: active ? colors.primaryDark : colors.text, fontWeight: "700", fontSize: isCompact ? 12 : 13 }}
                        >
                          {type}
                        </AdaptiveSingleLineText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Field
                  label="Categories"
                  value={form.categories}
                  onChangeText={(value) => onChange({ categories: value })}
                  helperText="Comma separate categories to help discovery"
                />
              </>
            ) : null}

            {section === "contact" ? (
              <>
                <Field label="Email" value={form.email} onChangeText={(value) => onChange({ email: value })} keyboardType="email-address" />
                <Field label="Phone" value={form.phone} onChangeText={(value) => onChange({ phone: value })} keyboardType="phone-pad" />
                <Field label="Website" value={form.website} onChangeText={(value) => onChange({ website: value })} />
                <Field label="LinkedIn" value={form.linkedin} onChangeText={(value) => onChange({ linkedin: value })} />
                <Field label="Twitter" value={form.twitter} onChangeText={(value) => onChange({ twitter: value })} />
                <Field label="Instagram" value={form.instagram} onChangeText={(value) => onChange({ instagram: value })} />
                <Field label="YouTube" value={form.youtube} onChangeText={(value) => onChange({ youtube: value })} />
              </>
            ) : null}

            {section === "address" ? (
              <>
                <Field label="Address line 1" value={form.line1} onChangeText={(value) => onChange({ line1: value })} />
                <Field label="Address line 2" value={form.line2} onChangeText={(value) => onChange({ line2: value })} />
                <Field label="City" value={form.city} onChangeText={(value) => onChange({ city: value })} />
                <Field label="State" value={form.state} onChangeText={(value) => onChange({ state: value })} />
                <Field label="Postal code" value={form.postalCode} onChangeText={(value) => onChange({ postalCode: value })} />
                <Field label="Country" value={form.country} onChangeText={(value) => onChange({ country: value })} />
              </>
            ) : null}

            <View style={{ marginTop: spacing.md }}>
              <Button label={saving ? "Saving…" : "Save changes"} onPress={onSubmit} loading={saving} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const Field = ({
  label,
  value,
  onChangeText,
  helperText,
  multiline,
  numberOfLines,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  helperText?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "number-pad" | "numbers-and-punctuation";
}) => {
  const { colors, spacing, radius } = useTheme();
  const { isCompact } = useResponsiveLayout();
  const layout = useCompanyProfileLayout();

  return (
    <View style={{ marginBottom: spacing.md }}>
      <AdaptiveSingleLineText allowOverflowScroll={false} style={[styles.label, { color: colors.muted, fontSize: isCompact ? 12 : 13 }]}> 
        {label}
      </AdaptiveSingleLineText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        style={[
          styles.input,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            color: colors.text,
            padding: isCompact ? spacing.sm : spacing.md,
            minHeight: multiline ? (isCompact ? 84 : 96) : layout.ctaHeight,
            fontSize: isCompact ? 14 : 15,
          },
        ]}
      />
      {helperText ? (
        <AdaptiveTwoLineText minimumFontScale={0.75} style={{ color: colors.muted, marginTop: 4, fontSize: isCompact ? 11 : 12 }}>
          {helperText}
        </AdaptiveTwoLineText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    minWidth: 0,
  },
  closeButton: {
    justifyContent: "center",
    minWidth: 56,
  },
  modalClose: {
    fontWeight: "700",
  },
  modalTitle: {
    fontWeight: "800",
    minWidth: 0,
    flexShrink: 1,
    textAlign: "center",
  },
  label: {
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.3,
    minWidth: 0,
    flexShrink: 1,
  },
  input: {
    borderWidth: 1,
    fontWeight: "600",
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    minWidth: 0,
  },
  segmentButton: {
    borderWidth: 1,
    borderRadius: 999,
    justifyContent: "center",
    minWidth: 0,
    maxWidth: "100%",
  },
});
