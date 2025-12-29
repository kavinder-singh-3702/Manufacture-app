import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from "react-native";
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
                {
                  color: isActive ? "#FFFFFF" : colors.text,
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
                      ? "rgba(255,255,255,0.25)"
                      : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    {
                      color: isActive ? "#FFFFFF" : colors.textSecondary,
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
