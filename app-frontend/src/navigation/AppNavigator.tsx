import { useState, ComponentType } from "react";
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { DashboardScreen } from "../screens/DashboardScreen";
import { InventoryScreen } from "../screens/InventoryScreen";
import { Typography } from "../components/common/Typography";
import { useTheme } from "../hooks/useTheme";
import { RouteName, routes } from "./routes";
import { useAuth } from "../hooks/useAuth";
import { AuthScreen } from "../screens/auth/AuthScreen";
import { SidebarMenu } from "../components/navigation/SidebarMenu";

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
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { colors, radius, spacing } = useTheme();
  const { user, logout } = useAuth();
  const ActiveScreen = screens[activeRoute];
  const displayName =
    typeof user?.displayName === "string" && user.displayName.trim().length ? user.displayName : "Operator";
  const email = user?.email;

  const handleInfo = (type: "profile" | "settings") => {
    setSidebarVisible(false);
    Alert.alert(
      type === "profile" ? "User profile" : "Preferences",
      "This section will let you fine tune your experience soon."
    );
  };

  const handleLogout = async () => {
    setSidebarVisible(false);
    await logout();
  };

  const menuItems = [
    { label: "User Profile", description: "Manage your personal details", onPress: () => handleInfo("profile") },
    { label: "Preferences", description: "Theme, notifications, and more", onPress: () => handleInfo("settings") },
    { label: "Logout", description: "Sign out of the workspace", onPress: handleLogout, tone: "danger" as const },
  ];

  return (
    <>
      <View style={styles.container}>
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
            },
          ]}
        >
          <TouchableOpacity style={styles.hamburger} onPress={() => setSidebarVisible(true)} accessibilityLabel="Open menu">
            <View style={[styles.hamburgerLine, { backgroundColor: colors.text }]} />
            <View style={[styles.hamburgerLine, { backgroundColor: colors.text, marginVertical: 4 }]} />
            <View style={[styles.hamburgerLine, { backgroundColor: colors.text }]} />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Typography variant="subheading">Hi, {displayName}</Typography>
            {email ? (
              <Typography variant="caption" color={colors.muted} style={{ marginTop: 2 }}>
                {email}
              </Typography>
            ) : null}
          </View>
        </View>
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
      <SidebarMenu
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        headerTitle={displayName}
        headerSubtitle={email}
        menuItems={menuItems}
      />
    </>
  );
};

export const AppNavigator = () => {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator />
      </View>
    );
  }

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
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hamburger: {
    padding: 8,
    marginRight: 12,
  },
  hamburgerLine: {
    width: 24,
    height: 2,
    borderRadius: 1,
  },
  userInfo: {
    flex: 1,
  },
});
