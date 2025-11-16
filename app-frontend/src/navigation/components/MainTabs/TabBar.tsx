import { FC } from "react";
import { View, TouchableOpacity } from "react-native";
import { Typography } from "../../../components/common/Typography";
import { useTheme } from "../../../hooks/useTheme";
import { RouteName } from "../../routes";
import { TabDefinition } from "../../config/mainTabs";
import { styles } from "./MainTabs.styles";

type TabBarProps = {
  tabs: TabDefinition[];
  activeRoute: RouteName;
  onRouteChange: (route: RouteName) => void;
};

export const TabBar: FC<TabBarProps> = ({ tabs, activeRoute, onRouteChange }) => {
  const { colors, radius, spacing } = useTheme();

  return (
    <View style={[styles.tabBar, { padding: spacing.xs }]}>
      {tabs.map((tab, index) => {
        const isActive = activeRoute === tab.route;
        const marginRight = index === tabs.length - 1 ? 0 : spacing.xs;

        return (
          <TouchableOpacity
            key={tab.route}
            onPress={() => onRouteChange(tab.route)}
            style={[
              styles.tab,
              {
                marginRight,
                backgroundColor: isActive ? colors.primary : colors.background,
                borderColor: colors.border,
                borderRadius: radius.pill,
              },
            ]}
          >
            <Typography variant="body" color={isActive ? "#fff" : colors.text}>
              {tab.label}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
