import { useCallback, useEffect, useMemo, useState } from "react";
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

const formatCompanyLabel = (companies: Company[], activeCompanyId: string | null) => {
  const active = companies.find((company) => company.id === activeCompanyId);
  if (active?.displayName) return active.displayName;
  if (activeCompanyId) return activeCompanyId;
  return "Select a company";
};

type CompanySwitcherCardProps = {
  onActiveCompanyResolved?: (company: Company | null) => void;
  onSwitched?: () => void;
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
        onSwitched?.();
      } catch (err) {
        const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to switch company.";
        setError(message);
      } finally {
        setSwitchingId(null);
      }
    },
    [companies, loadCompanies, onActiveCompanyResolved, onSwitched, refreshUser, switchCompany]
  );

  const activeLabel = useMemo(() => formatCompanyLabel(companies, activeCompanyId), [activeCompanyId, companies]);

  const handleOpenProfile = () => {
    const targetId = activeCompanyId ?? companies[0]?.id;
    if (!targetId) return;
    navigation.navigate("CompanyProfile", { companyId: targetId });
  };

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
          <Text style={[styles.companyName, { color: colors.text }]} numberOfLines={1}>
            {company.displayName}
          </Text>
          <Text style={[styles.companyMeta, { color: colors.textMuted }]} numberOfLines={1}>
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
          {companies.map((company) => renderCompanyRow(company))}
          <TouchableOpacity
            onPress={onAddCompany}
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
        </View>
      )}

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
    marginBottom: 8,
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
});
