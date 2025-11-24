import { FC } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { RouteName } from "../../navigation/routes";

type TabItem = {
  route: RouteName;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type BottomTabBarProps = {
  activeRoute: RouteName;
  onTabPress: (route: RouteName) => void;
  tabs: TabItem[];
};

export const BottomTabBar: FC<BottomTabBarProps> = ({
  activeRoute,
  onTabPress,
  tabs
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.borderDark
        }
      ]}
    >
      {tabs.map((tab) => {
        const isActive = activeRoute === tab.route;

        return (
          <TouchableOpacity
            key={tab.route}
            style={styles.tab}
            onPress={() => onTabPress(tab.route)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon}
              size={24}
              color={isActive ? colors.textSecondary : colors.textMuted}
            />
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.textSecondary : colors.textMuted }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 10,
    borderTopWidth: 1,
    justifyContent: "space-around"
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  },
  label: {
    fontSize: 13,
    fontWeight: "500"
  }
});
