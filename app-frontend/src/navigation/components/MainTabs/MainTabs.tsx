import { useState } from "react";
import { View, Alert } from "react-native";
import { SidebarMenu } from "../../../components/navigation/SidebarMenu";
import { useAuth } from "../../../hooks/useAuth";
import { RouteName, routes } from "../../routes";
import { tabDefinitions, tabScreens } from "../../config/mainTabs";
import { HomeToolbar } from "./components/HomeToolbar";
import { styles } from "./MainTabs.styles";

const DEFAULT_ROUTE: RouteName = routes.DASHBOARD;

type MainTabsProps = {
  onShowProfile?: () => void;
};

export const MainTabs = ({ onShowProfile }: MainTabsProps) => {
  const [activeRoute, setActiveRoute] = useState<RouteName>(DEFAULT_ROUTE);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout, requestLogin } = useAuth();
  const ActiveScreen = tabScreens[activeRoute];
  const displayName =
    typeof user?.displayName === "string" && user.displayName.trim().length ? user.displayName : "Operator";
  const email = user?.email;
  const isGuest = user?.role === "guest";
  const isAuthenticated = Boolean(user) && !isGuest;

  const handleInfo = (type: "profile" | "settings") => {
    setSidebarVisible(false);
    if (type === "profile" && onShowProfile) {
      onShowProfile();
      return;
    }
    Alert.alert(
      type === "profile" ? "User profile" : "Preferences",
      "This section will let you fine tune your experience soon."
    );
  };

  const handleLoginPrompt = () => {
    setSidebarVisible(false);
    requestLogin();
  };

  const handleLogout = async () => {
    setSidebarVisible(false);
    await logout();
  };

  const handleNavigate = (route: RouteName) => {
    setActiveRoute(route);
    setSidebarVisible(false);
  };

  const navigationItems = tabDefinitions.map((tab) => ({
    label: tab.label,
    description: activeRoute === tab.route ? "Currently viewing" : undefined,
    onPress: () => handleNavigate(tab.route),
  }));

  const profileOrLoginItem = isAuthenticated
    ? { label: "Profile", description: "Manage your personal details", onPress: () => handleInfo("profile") }
    : {
        label: "Login",
        description: "Access your workspace",
        onPress: handleLoginPrompt,
        tone: "primary" as const,
      };

  const actionItems = isAuthenticated
    ? [{ label: "Logout", description: "Sign out of the workspace", onPress: handleLogout, tone: "danger" as const }]
    : [];

  const menuItems = [
    ...navigationItems,
    profileOrLoginItem,
    { label: "Preferences", description: "Theme, notifications, and more", onPress: () => handleInfo("settings") },
    ...actionItems,
  ];

  return (
    <>
      <View style={styles.container}>
        <HomeToolbar
          onMenuPress={() => setSidebarVisible(true)}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />
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
