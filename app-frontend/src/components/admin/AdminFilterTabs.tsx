import { ScrollView, TouchableOpacity, Text, View, StyleSheet, useWindowDimensions } from "react-native";
import { useTheme } from "../../hooks/useTheme";

type Tab<T extends string> = {
  key: T;
  label: string;
  count?: number;
};

type AdminFilterTabsProps<T extends string> = {
  tabs: Tab<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
};

export function AdminFilterTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: AdminFilterTabsProps<T>) {
  const { colors, radius } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 390;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={{ marginBottom: 16 }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
            style={[
              styles.tab,
              compact ? styles.tabCompact : null,
              {
                backgroundColor: isActive ? colors.primary : colors.surface,
                borderColor: isActive ? colors.primary : colors.border,
                borderRadius: radius.pill,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                compact ? styles.tabTextCompact : null,
                {
                  color: isActive ? colors.textOnPrimary : colors.text,
                },
              ]}
            >
              {tab.label}
            </Text>
            {tab.count !== undefined && (
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: isActive
                      ? colors.primary + "40"
                      : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    {
                      color: isActive ? colors.textOnPrimary : colors.textSecondary,
                    },
                  ]}
                >
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 36,
    paddingHorizontal: 14,
    borderWidth: 1,
    gap: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tabCompact: {
    height: 33,
    paddingHorizontal: 12,
  },
  tabTextCompact: {
    fontSize: 12,
  },
  countBadge: {
    minWidth: 18,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  countText: {
    fontSize: 9,
    fontWeight: "600",
  },
});
