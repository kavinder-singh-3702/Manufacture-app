import { useState, ComponentType } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { DashboardScreen } from "../screens/DashboardScreen";
import { InventoryScreen } from "../screens/InventoryScreen";
import { Typography } from "../components/common/Typography";
import { useTheme } from "../hooks/useTheme";
import { RouteName, routes } from "./routes";
import { useAuth } from "../hooks/useAuth";
import { AuthScreen } from "../screens/auth/AuthScreen";

const screens: Record<RouteName, ComponentType> = {
  [routes.DASHBOARD]: DashboardScreen,
  [routes.INVENTORY]: InventoryScreen,
};

const tabs = [
  { route: routes.DASHBOARD, label: "Operations" },
  { route: routes.INVENTORY, label: "Inventory" },
];

const MainTabs = () => {
  const [activeRoute, setActiveRoute] = useState<RouteName>(routes.DASHBOARD);
  const { colors, radius, spacing } = useTheme();
  const ActiveScreen = screens[activeRoute];

  return (
    <View style={styles.container}>
      <View style={[styles.tabBar, { padding: spacing.xs }]}>
        {tabs.map((tab, index) => {
          const isActive = activeRoute === tab.route;
          return (
            <TouchableOpacity
              key={tab.route}
              onPress={() => setActiveRoute(tab.route)}
              style={[
                styles.tab,
                {
                  marginRight: index === tabs.length - 1 ? 0 : spacing.xs,
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
      <View style={styles.screenContainer}>
        <ActiveScreen />
      </View>
    </View>
  );
};

export const AppNavigator = () => {
  const { user } = useAuth();
  if (!user) {
    return <AuthScreen />;
  }
  return <MainTabs />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  screenContainer: {
    flex: 1,
  },
});
