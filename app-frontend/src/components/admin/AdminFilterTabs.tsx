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
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 390;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
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
                compact && styles.tabCompact,
                isActive
                  ? {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 3,
                    }
                  : {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  compact && styles.tabTextCompact,
                  { color: isActive ? colors.textOnPrimary : colors.text },
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
              {tab.count !== undefined && (
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: isActive ? "rgba(255,255,255,0.25)" : colors.primary + "20",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      { color: isActive ? colors.textOnPrimary : colors.primary },
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 4,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 34,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderRadius: 999,
    gap: 6,
  },
  tabCompact: {
    height: 30,
    paddingHorizontal: 10,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
  },
  tabTextCompact: {
    fontSize: 12,
  },
  countBadge: {
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  countText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
