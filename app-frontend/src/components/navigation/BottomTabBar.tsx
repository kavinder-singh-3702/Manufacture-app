import { FC } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Image, ImageSourcePropType } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { RouteName } from "../../navigation/routes";

type IoniconName = keyof typeof Ionicons.glyphMap;

type TabItem = {
  route: RouteName;
  label: string;
  icon: IoniconName | ImageSourcePropType;
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
  const { resolvedMode } = useThemeMode();
  const tabBackground = resolvedMode === "dark" ? colors.backgroundSecondary : colors.background;
  const tabBorder = resolvedMode === "dark" ? "rgba(255,255,255,0.12)" : colors.borderDark;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: tabBackground,
          borderTopColor: tabBorder
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
            {typeof tab.icon === "string" ? (
              <Ionicons
                name={tab.icon}
                size={24}
                color={isActive ? colors.textSecondary : colors.textMuted}
              />
            ) : (
              <Image
                source={tab.icon}
                style={{
                  width: 26,
                  height: 26,
                  tintColor: isActive ? colors.textSecondary : colors.textMuted,
                  resizeMode: "contain"
                }}
              />
            )}
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
