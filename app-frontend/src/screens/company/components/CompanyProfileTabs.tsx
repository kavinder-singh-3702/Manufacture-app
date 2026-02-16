import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { AdaptiveSingleLineText } from "../../../components/text/AdaptiveSingleLineText";
import { useCompanyProfileLayout } from "./companyProfile.layout";

export type CompanyProfileTab = "overview" | "products" | "compliance";

type CompanyProfileTabsProps = {
  activeTab: CompanyProfileTab;
  onChange: (tab: CompanyProfileTab) => void;
  productCount?: number;
};

const tabs: Array<{ key: CompanyProfileTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "products", label: "Products" },
  { key: "compliance", label: "Compliance" },
];

export const CompanyProfileTabs = ({ activeTab, onChange, productCount = 0 }: CompanyProfileTabsProps) => {
  const { colors } = useTheme();
  const layout = useCompanyProfileLayout();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
          borderRadius: layout.compact ? 12 : 14,
          padding: layout.xCompact ? 3 : 4,
          gap: layout.xCompact ? 3 : 4,
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        const showCount = tab.key === "products";
        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.9}
            onPress={() => onChange(tab.key)}
            style={[
              styles.tabButton,
              {
                backgroundColor: isActive ? colors.primary + "18" : "transparent",
                borderColor: isActive ? colors.primary + "55" : "transparent",
                minHeight: layout.chipHeight + 8,
                borderRadius: layout.compact ? 9 : 10,
                paddingHorizontal: layout.xCompact ? 5 : 8,
                gap: layout.xCompact ? 4 : 6,
              },
            ]}
          >
            <AdaptiveSingleLineText
              allowOverflowScroll={false}
              minimumFontScale={0.72}
              style={[
                styles.tabLabel,
                {
                  color: isActive ? colors.primary : colors.textMuted,
                  fontSize: layout.xCompact ? 11 : 12,
                },
              ]}
            >
              {tab.label}
            </AdaptiveSingleLineText>
            {showCount ? (
              <View
                style={[
                  styles.countPill,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceElevated,
                    minHeight: layout.xCompact ? 16 : 18,
                    paddingHorizontal: layout.xCompact ? 4 : 5,
                  },
                ]}
              >
                <AdaptiveSingleLineText
                  allowOverflowScroll={false}
                  minimumFontScale={0.72}
                  style={[styles.countText, { color: colors.text, fontSize: layout.xCompact ? 9 : 10 }]}
                >
                  {productCount}
                </AdaptiveSingleLineText>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
    flexDirection: "row",
    gap: 4,
  },
  tabButton: {
    flex: 1,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    minWidth: 0,
    flexShrink: 1,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "700",
    minWidth: 0,
    flexShrink: 1,
  },
  countPill: {
    minWidth: 20,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    fontSize: 10,
    fontWeight: "700",
    minWidth: 0,
    flexShrink: 1,
  },
});
