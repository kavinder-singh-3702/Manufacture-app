import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { useTheme } from "../../hooks/useTheme";

type SubTab = {
  key: string;
  label: string;
  badge?: number;
};

type CommandCenterSubTabsProps = {
  tabs: SubTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
};

export const CommandCenterSubTabs = ({
  tabs,
  activeTab,
  onTabChange,
}: CommandCenterSubTabsProps) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrapper, { borderBottomColor: colors.border }]}>
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
              style={styles.tab}
            >
              <View style={styles.tabLabelRow}>
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isActive ? colors.primary : colors.textMuted,
                      fontWeight: isActive ? "800" : "600",
                    },
                  ]}
                >
                  {tab.label}
                </Text>
                {tab.badge != null && tab.badge > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.error }]}>
                    <Text style={styles.badgeText}>
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </Text>
                  </View>
                )}
              </View>
              {isActive && (
                <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { borderBottomWidth: 0.5, paddingHorizontal: 16 },
  container: { flexDirection: "row", gap: 24 },
  tab: { paddingBottom: 12, position: "relative" },
  tabLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tabText: { fontSize: 14, letterSpacing: 0.5, textTransform: "uppercase" },
  badge: { minWidth: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  indicator: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3, borderRadius: 1.5 },
});
