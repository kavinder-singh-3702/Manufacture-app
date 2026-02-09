import { useState, useCallback } from "react";
import { View, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SidebarMenu } from "../../../components/navigation/SidebarMenu";
import { BottomTabBar } from "../../../components/navigation/BottomTabBar";
import { useAuth } from "../../../hooks/useAuth";
import { useTheme } from "../../../hooks/useTheme";
import { RouteName, routes } from "../../routes";
import { tabDefinitions, tabScreens } from "../../config/mainTabs";
import { HomeToolbar } from "./components/HomeToolbar";
import { styles } from "./MainTabs.styles";
import { RootStackParamList } from "../../types";

const DEFAULT_ROUTE: RouteName = routes.DASHBOARD;

export const MainTabs = () => {
  const [activeRoute, setActiveRoute] = useState<RouteName>(DEFAULT_ROUTE);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const ActiveScreen = tabScreens[activeRoute];
  const displayName =
    typeof user?.displayName === "string" && user.displayName.trim().length ? user.displayName : "Operator";
  const email = user?.email;
  const isAuthenticated = Boolean(user);

  const handleInfo = (type: "profile" | "settings") => {
    setSidebarVisible(false);
    Alert.alert(
      type === "profile" ? "User profile" : "Preferences",
      "This section will let you fine tune your experience soon."
    );
  };

  const handleLoginPrompt = () => {
    setSidebarVisible(false);
    Alert.alert("Login required", "Access your workspace by signing in.");
  };

  const handleLogout = async () => {
    setSidebarVisible(false);
    await logout();
  };

  const handleNavigate = (route: RouteName) => {
    setActiveRoute(route);
    setSidebarVisible(false);
  };

  const handleSearchPress = useCallback(() => {
    navigation.navigate("ProductSearch", { initialQuery: searchQuery.trim() || undefined });
    setSearchQuery("");
  }, [navigation, searchQuery]);

  const navigationItems = tabDefinitions.map((tab) => ({
    label: tab.label,
    description: activeRoute === tab.route ? "Currently viewing" : undefined,
    isActive: activeRoute === tab.route,
    onPress: () => handleNavigate(tab.route),
  }));

  const bottomTabs = tabDefinitions.map((tab) => ({
    route: tab.route,
    label: tab.label,
    icon: tab.icon,
  }));

  const menuItems = [
    ...navigationItems,
    isAuthenticated
      ? { label: "Profile", description: "Manage your personal details", onPress: () => handleInfo("profile") }
      : { label: "Login", description: "Return to the sign in screen", onPress: handleLoginPrompt },
    { label: "Preferences", description: "Theme, notifications, and more", onPress: () => handleInfo("settings") },
    ...(isAuthenticated
      ? [{ label: "Logout", description: "Sign out of the workspace", onPress: handleLogout, tone: "danger" as const }]
      : []),
  ];

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <HomeToolbar
          onMenuPress={() => setSidebarVisible(true)}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchPress={handleSearchPress}
        />
        <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
          <ActiveScreen />
        </View>
        <BottomTabBar
          activeRoute={activeRoute}
          onTabPress={handleNavigate}
          tabs={bottomTabs}
        />
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
