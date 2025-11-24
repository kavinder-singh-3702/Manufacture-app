import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { BUSINESS_ACCOUNT_TYPES } from "../../../constants/business";
import { Button } from "../../../components/common/Button";
import { useTheme } from "../../../hooks/useTheme";
import { CompanyEditorSection, CompanyProfileFormState } from "./types";

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
  if (!section) return null;

  const title = section === "overview" ? "Edit overview" : section === "contact" ? "Edit contact" : "Edit address";

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.modalClose, { color: colors.text }]}>Close</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
          {section === "overview" ? (
            <>
              <Field label="Display name" value={form.displayName} onChangeText={(value) => onChange({ displayName: value })} />
              <Field label="Legal name" value={form.legalName} onChangeText={(value) => onChange({ legalName: value })} />
              <Field label="Description" value={form.description} onChangeText={(value) => onChange({ description: value })} multiline numberOfLines={4} />
              <Field label="Logo URL" value={form.logoUrl} onChangeText={(value) => onChange({ logoUrl: value })} />
              <Text style={[styles.label, { color: colors.muted }]}>Type</Text>
              <View style={styles.segmentRow}>
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
                        },
                      ]}
                    >
                      <Text style={{ color: active ? colors.primaryDark : colors.text, fontWeight: "700" }}>{type}</Text>
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
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
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
            padding: spacing.md,
            minHeight: multiline ? 96 : undefined,
          },
        ]}
      />
      {helperText ? <Text style={{ color: colors.muted, marginTop: 4 }}>{helperText}</Text> : null}
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  modalClose: {
    fontWeight: "700",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    fontSize: 15,
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  segmentButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
