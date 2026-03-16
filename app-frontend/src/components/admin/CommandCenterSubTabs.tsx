import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { useTheme } from "../../hooks/useTheme";

type SubTab = {
  key: string;
  label: string;
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
  tabText: { fontSize: 14, letterSpacing: 0.5, textTransform: "uppercase" },
  indicator: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3, borderRadius: 1.5 },
});
