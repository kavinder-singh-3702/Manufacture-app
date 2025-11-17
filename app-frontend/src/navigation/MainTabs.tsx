import { ComponentType, useCallback, useMemo, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { BottomTabBarProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { Typography } from "../components/common/Typography";
import { DashboardScreen } from "../screens/DashboardScreen";
import { InventoryScreen } from "../screens/InventoryScreen";
import { SidebarMenu } from "../components/navigation/SidebarMenu";
import { RouteName, routes } from "./routes";

type MainTabParamList = Record<RouteName, undefined>;

const Tab = createBottomTabNavigator<MainTabParamList>();

const screenRegistry: Record<RouteName, ComponentType> = {
  [routes.DASHBOARD]: DashboardScreen,
  [routes.INVENTORY]: InventoryScreen,
};

const tabMetadata = [
  { route: routes.DASHBOARD, label: "Operations" },
  { route: routes.INVENTORY, label: "Inventory" },
] as const;

export const MainTabs = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { colors } = useTheme();
  const { user, logout } = useAuth();

  const displayName = useMemo(() => {
    if (typeof user?.displayName === "string" && user.displayName.trim().length) {
      return user.displayName;
    }
    return "Operator";
  }, [user?.displayName]);

  const email = user?.email;

  const handleInfo = useCallback((type: "profile" | "settings") => {
    setSidebarVisible(false);
    Alert.alert(
      type === "profile" ? "User profile" : "Preferences",
      "This section will let you fine tune your experience soon."
    );
  }, []);

  const handleLogout = useCallback(async () => {
    setSidebarVisible(false);
    await logout();
  }, [logout]);

  const menuItems = useMemo(
    () => [
      { label: "User Profile", description: "Manage your personal details", onPress: () => handleInfo("profile") },
      { label: "Preferences", description: "Theme, notifications, and more", onPress: () => handleInfo("settings") },
      { label: "Logout", description: "Sign out of the workspace", onPress: handleLogout, tone: "danger" as const },
    ],
    [handleInfo, handleLogout]
  );

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <MainHeader displayName={displayName} email={email} onOpenMenu={() => setSidebarVisible(true)} />
        <View style={styles.contentArea}>
          <Tab.Navigator
            initialRouteName={routes.DASHBOARD}
            screenOptions={{ headerShown: false }}
            sceneContainerStyle={{ backgroundColor: colors.background }}
            tabBar={(props) => <PrimaryTabBar {...props} />}
          >
            {tabMetadata.map((tab) => {
              const ScreenComponent = screenRegistry[tab.route];
              return (
                <Tab.Screen key={tab.route} name={tab.route} component={ScreenComponent} options={{ title: tab.label }} />
              );
            })}
          </Tab.Navigator>
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

const MainHeader = ({
  displayName,
  email,
  onOpenMenu,
}: {
  displayName: string;
  email?: string | null;
  onOpenMenu: () => void;
}) => {
  const { colors, spacing } = useTheme();

  return (
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
      <TouchableOpacity style={styles.hamburger} onPress={onOpenMenu} accessibilityLabel="Open menu">
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
  );
};

const PrimaryTabBar = ({ state, navigation, descriptors }: BottomTabBarProps) => {
  const { colors, radius, spacing } = useTheme();

  return (
    <View style={[styles.tabBar, { padding: spacing.xs }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const label = descriptors[route.key].options.title ?? route.name;

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name as never);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : undefined}
            onPress={onPress}
            style={[
              styles.tab,
              {
                marginRight: index === state.routes.length - 1 ? 0 : spacing.xs,
                backgroundColor: isFocused ? colors.primary : colors.background,
                borderColor: colors.border,
                borderRadius: radius.pill,
              },
            ]}
          >
            <Typography variant="body" color={isFocused ? "#fff" : colors.text}>
              {label}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
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
});
