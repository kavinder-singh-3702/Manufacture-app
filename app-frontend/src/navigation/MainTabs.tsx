import { ComponentType, useCallback, useMemo, useState } from "react";
import { View, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { BottomTabBarProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { Typography } from "../components/common/Typography";
import { SidebarMenu } from "../components/navigation/SidebarMenu";
import { DashboardScreen } from "../screens/DashboardScreen";
import { InventoryScreen } from "../screens/InventoryScreen";
import { RouteName, routes } from "./routes";
import { HomeToolbar } from "./components/MainTabs/components/HomeToolbar";
import { MainTabParamList, RootStackParamList, MAIN_TAB_ORDER } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

const screenRegistry: Record<RouteName, ComponentType> = {
  [routes.DASHBOARD]: DashboardScreen,
  [routes.INVENTORY]: InventoryScreen,
};

export const MainTabs = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRoute, setActiveRoute] = useState<RouteName>(routes.DASHBOARD);
  const { colors } = useTheme();
  const { user, logout, requestLogin } = useAuth();
  const stackNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const isGuest = user?.role === "guest";
  const isAuthenticated = Boolean(user) && !isGuest;

  const displayName = useMemo(() => {
    if (typeof user?.displayName === "string" && user.displayName.trim().length) {
      return user.displayName;
    }
    return "Operator";
  }, [user?.displayName]);

  const email = user?.email;

  const handleNavigateToRoute = useCallback(
    (route: RouteName) => {
      // Jump to a nested tab via the root stack to keep deep linking consistent.
      stackNavigation.navigate("Main", { screen: route });
      setSidebarVisible(false);
    },
    [stackNavigation]
  );

  const handleShowProfile = useCallback(() => {
    setSidebarVisible(false);
    if (!isAuthenticated) {
      requestLogin();
      return;
    }
    stackNavigation.navigate("Profile");
  }, [isAuthenticated, requestLogin, stackNavigation]);

  const handlePreferences = useCallback(() => {
    setSidebarVisible(false);
    Alert.alert("Preferences", "This section will let you fine tune your experience soon.");
  }, []);

  const handleLogout = useCallback(async () => {
    setSidebarVisible(false);
    await logout();
  }, [logout]);

  const navigationItems = useMemo(
    () =>
      MAIN_TAB_ORDER.map((tab) => ({
        label: tab.label,
        description: activeRoute === tab.route ? "Currently viewing" : undefined,
        onPress: () => handleNavigateToRoute(tab.route),
      })),
    [activeRoute, handleNavigateToRoute]
  );

  const profileOrLoginItem = isAuthenticated
    ? {
        label: "Profile",
        description: "Manage your personal details",
        onPress: handleShowProfile,
      }
    : {
        label: "Login",
        description: "Access your workspace",
        onPress: () => {
          setSidebarVisible(false);
          requestLogin();
        },
        tone: "primary" as const,
      };

  const menuItems = useMemo(
    () => [
      ...navigationItems,
      profileOrLoginItem,
      { label: "Preferences", description: "Theme, notifications, and more", onPress: handlePreferences },
      ...(isAuthenticated
        ? [{ label: "Logout", description: "Sign out of the workspace", onPress: handleLogout, tone: "danger" as const }]
        : []),
    ],
    [handleLogout, handlePreferences, isAuthenticated, navigationItems, profileOrLoginItem]
  );

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <HomeToolbar onMenuPress={() => setSidebarVisible(true)} searchValue={searchQuery} onSearchChange={setSearchQuery} />
        <View style={styles.contentArea}>
          <Tab.Navigator
            initialRouteName={routes.DASHBOARD}
            screenOptions={{ headerShown: false }}
            screenListeners={({ route }) => ({
              focus: () => setActiveRoute(route.name as RouteName),
            })}
            tabBar={(props) => <PrimaryTabBar {...props} />}
          >
            {MAIN_TAB_ORDER.map((tab) => {
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
