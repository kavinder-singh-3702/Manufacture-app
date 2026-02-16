import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../../hooks/useTheme";
import { useAuth } from "../../../hooks/useAuth";
import { ApiError } from "../../../services/http";
import { companyService } from "../../../services/company.service";
import type { Company } from "../../../types/company";
import { RootStackParamList } from "../../../navigation/types";
import { CompanyAvatar } from "../../../navigation/components/MainTabs/components/ProfileAvatar";

type CompanySwitcherCardProps = {
  onActiveCompanyResolved?: (company: Company | null) => void;
  onSwitched?: (company: Company | null) => void;
  onAddCompany?: () => void;
};

export const CompanySwitcherCard = ({ onActiveCompanyResolved, onSwitched, onAddCompany }: CompanySwitcherCardProps) => {
  const { colors, spacing, radius } = useTheme();
  const { user, switchCompany, refreshUser } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const activeCompanyId = user?.activeCompany ?? null;

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await companyService.list();
      setCompanies(response.companies);
      setError(null);
      const activeResolved =
        response.companies.find((company) => company.id === activeCompanyId) ?? response.companies[0] ?? null;
      onActiveCompanyResolved?.(activeResolved);
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to load companies.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [activeCompanyId, onActiveCompanyResolved]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleSwitch = useCallback(
    async (companyId: string) => {
      try {
        setSwitchingId(companyId);
        setError(null);
        await switchCompany(companyId);
        await refreshUser().catch(() => null);
        await loadCompanies();
        const selected = companies.find((c) => c.id === companyId) ?? null;
        onActiveCompanyResolved?.(selected);
        onSwitched?.(selected);
      } catch (err) {
        const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to switch company.";
        setError(message);
      } finally {
        setSwitchingId(null);
      }
    },
    [companies, loadCompanies, onActiveCompanyResolved, onSwitched, refreshUser, switchCompany]
  );

  const handleOpenProfile = () => {
    const targetId = activeCompanyId ?? companies[0]?.id;
    if (!targetId) return;
    navigation.navigate("CompanyProfile", { companyId: targetId });
  };

  const handleAddCompany = useCallback(() => {
    if (onAddCompany) {
      onAddCompany();
      return;
    }
    navigation.navigate("CompanyCreate");
  }, [navigation, onAddCompany]);

  const renderCompanyRow = (company: Company) => {
    const isActive = company.id === activeCompanyId;
    return (
      <TouchableOpacity
        key={company.id}
        onPress={() => handleSwitch(company.id)}
        disabled={switchingId === company.id}
        style={[
          styles.companyRow,
          {
            borderColor: isActive ? colors.primary : colors.border,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            padding: spacing.md,
          },
        ]}
      >
        <CompanyAvatar company={company} size={44} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={[styles.companyName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
            {company.displayName}
          </Text>
          <Text style={[styles.companyMeta, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
            {company.type ?? "normal"} • {company.complianceStatus ?? "pending"}
          </Text>
        </View>
        <View
          style={[
            styles.checkCircle,
            {
              borderColor: isActive ? colors.primary : colors.border,
              backgroundColor: isActive ? colors.primary : "transparent",
            },
          ]}
        >
          {isActive ? <Text style={{ color: colors.textOnPrimary, fontSize: 12 }}>✓</Text> : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.sheet,
        {
          backgroundColor: colors.surface,
          borderRadius: 20,
          padding: spacing.md,
        },
      ]}
    >
      <View style={[styles.handle, { backgroundColor: colors.border }]} />
      <Text style={[styles.sheetTitle, { color: colors.text }]}>Switch company</Text>
      <Text style={[styles.sheetSubtitle, { color: colors.textMuted }]}>
        Choose an active company for accounting and product management.
      </Text>

      {error ? (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.errorBg,
              borderColor: colors.error,
              borderRadius: radius.md,
              padding: spacing.md,
            },
          ]}
        >
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View
          style={[
            styles.loaderCard,
            {
              borderColor: colors.border,
              backgroundColor: colors.surfaceElevated,
              borderRadius: radius.lg,
              padding: spacing.lg,
            },
          ]}
        >
          <ActivityIndicator color={colors.primary} />
          <Text style={{ color: colors.muted, marginTop: spacing.sm }}>Loading companies…</Text>
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {companies.length ? (
            <>
              {companies.map((company) => renderCompanyRow(company))}
              <TouchableOpacity
                onPress={handleAddCompany}
                style={[
                  styles.addRow,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceElevated,
                    borderRadius: radius.md,
                    padding: spacing.md,
                  },
                ]}
              >
                <Text style={{ fontSize: 18, color: colors.primary, fontWeight: "800" }}>+</Text>
                <Text style={{ marginLeft: spacing.sm, color: colors.text, fontWeight: "700" }}>Add company</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View
              style={[
                styles.emptyCard,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                },
              ]}
            >
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No companies yet</Text>
              <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
                Create your first company to unlock accounting, inventory, and company scoped workflows.
              </Text>

              <View style={styles.emptyActionsRow}>
                <TouchableOpacity
                  onPress={handleAddCompany}
                  style={[
                    styles.emptyPrimaryAction,
                    {
                      backgroundColor: colors.primary,
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <Text style={[styles.emptyPrimaryActionLabel, { color: colors.textOnPrimary }]}>Create company</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={loadCompanies}
                  style={[
                    styles.emptySecondaryAction,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <Text style={[styles.emptySecondaryActionLabel, { color: colors.text }]}>Refresh</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {companies.length ? (
        <TouchableOpacity
          onPress={handleOpenProfile}
          style={[
            styles.bottomCta,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              paddingVertical: spacing.md,
              marginTop: spacing.md,
            },
          ]}
        >
          <Text style={{ color: colors.text, fontWeight: "700", textAlign: "center" }}>Go to Company Center</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  sheet: {
    width: "100%",
  },
  handle: {
    alignSelf: "center",
    width: 48,
    height: 5,
    borderRadius: 999,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 10,
  },
  errorBanner: {
    borderWidth: 1,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  loaderCard: {
    borderWidth: 1,
    alignItems: "center",
  },
  companyRow: {
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "700",
  },
  companyMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  addRow: {
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  bottomCta: {
    borderWidth: 1,
  },
  emptyCard: {
    borderWidth: 1,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  emptyBody: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  emptyActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  emptyPrimaryAction: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  emptyPrimaryActionLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  emptySecondaryAction: {
    minHeight: 42,
    minWidth: 94,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  emptySecondaryActionLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
});
