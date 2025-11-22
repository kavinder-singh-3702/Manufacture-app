import { useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { companyService } from "../../services/company.service";
import { BUSINESS_ACCOUNT_TYPES, BusinessAccountType } from "../../constants/business";
import { ApiError } from "../../services/http";
import { RootStackParamList } from "../../navigation/types";
import { routes } from "../../navigation/routes";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/common/Button";

export const CompanyCreateScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({
    displayName: "",
    type: "normal" as BusinessAccountType,
    logoUrl: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.displayName.trim()) {
      setError("Enter a company name to continue.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await companyService.create({
        displayName: form.displayName.trim(),
        type: form.type,
        logoUrl: form.logoUrl?.trim() || undefined,
      });
      await refreshUser().catch(() => null);
      navigation.navigate("Main", { screen: routes.DASHBOARD as never });
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to create company.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[styles.title, { color: colors.text }]}>Create a company</Text>
        <Text style={{ color: colors.textMuted, marginBottom: spacing.md }}>
          Add a new entity to switch between in your workspace.
        </Text>

        <Text style={[styles.label, { color: colors.muted }]}>Display name</Text>
        <TextInput
          value={form.displayName}
          onChangeText={(value) => setForm((prev) => ({ ...prev, displayName: value }))}
          placeholder="e.g., Acme Textiles"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              color: colors.text,
              borderRadius: radius.md,
              padding: spacing.md,
            },
          ]}
        />

        <Text style={[styles.label, { color: colors.muted, marginTop: spacing.md }]}>Logo URL</Text>
        <TextInput
          value={form.logoUrl}
          onChangeText={(value) => setForm((prev) => ({ ...prev, logoUrl: value }))}
          placeholder="https://..."
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              color: colors.text,
              borderRadius: radius.md,
              padding: spacing.md,
            },
          ]}
        />

        <Text style={[styles.label, { color: colors.muted, marginTop: spacing.md }]}>Type</Text>
        <View style={[styles.segmentRow, { marginTop: spacing.xs }]}>
          {BUSINESS_ACCOUNT_TYPES.map((type) => {
            const active = form.type === type;
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setForm((prev) => ({ ...prev, type }))}
                style={[
                  styles.segmentButton,
                  {
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primaryLight : colors.surface,
                    borderRadius: radius.pill,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                  },
                ]}
              >
                <Text style={{ color: active ? colors.primaryDark : colors.text, fontWeight: "700" }}>{type}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

        <View style={{ marginTop: spacing.lg }}>
          <Button label={saving ? "Creating…" : "Create company"} onPress={handleSubmit} loading={saving} />
        </View>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: spacing.md, alignItems: "center" }}
        >
          <Text style={{ color: colors.primary, fontWeight: "600" }}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    fontSize: 16,
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  segmentButton: {
    borderWidth: 1,
  },
  errorText: {
    marginTop: 8,
    fontWeight: "700",
  },
});
