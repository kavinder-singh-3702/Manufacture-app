import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../hooks/useTheme";

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

  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.surface }]}>
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
              },
            ]}
          >
            <Text style={[styles.tabLabel, { color: isActive ? colors.primary : colors.textMuted }]}>{tab.label}</Text>
            {showCount ? (
              <View style={[styles.countPill, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.countText, { color: colors.text }]}>{productCount}</Text>
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
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "700",
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
  },
});
