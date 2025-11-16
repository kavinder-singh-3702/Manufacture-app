import { useState } from "react";
import { View, Alert } from "react-native";
import { SidebarMenu } from "../../../components/navigation/SidebarMenu";
import { useAuth } from "../../../hooks/useAuth";
import { RouteName, routes } from "../../routes";
import { tabDefinitions, tabScreens } from "../../config/mainTabs";
import { TabBar } from "./TabBar";
import { UserHeader } from "./UserHeader";
import { styles } from "./MainTabs.styles";

const DEFAULT_ROUTE: RouteName = routes.DASHBOARD;

export const MainTabs = () => {
  const [activeRoute, setActiveRoute] = useState<RouteName>(DEFAULT_ROUTE);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { user, logout } = useAuth();
  const ActiveScreen = tabScreens[activeRoute];
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
        <UserHeader displayName={displayName} email={email} onMenuPress={() => setSidebarVisible(true)} />
        <TabBar tabs={tabDefinitions} activeRoute={activeRoute} onRouteChange={setActiveRoute} />
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
