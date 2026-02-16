import { ComponentType, useCallback, useEffect, useMemo, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { useUnreadMessages } from "../providers/UnreadMessagesProvider";
import { useNotifications } from "../providers/NotificationsProvider";
import { SidebarMenu } from "../components/navigation/SidebarMenu";
import { HomeToolbar } from "./components/MainTabs/components/HomeToolbar";
import { FooterRail } from "./components/MainTabs/components/FooterRail";
import { CompanySwitcherCard } from "../components/company";
import { AppRole, isAdminRole } from "../constants/roles";
import { companyService } from "../services/company.service";
import { Company } from "../types/company";

import { DashboardScreen } from "../screens/DashboardScreen";
import { StatsScreen } from "../screens/StatsScreen";
import { UserManagementScreen, VerificationsScreen, CompaniesScreen } from "../screens/admin";
import { AdminChatScreen } from "../screens/chat";
import { AdminProductsScreen } from "../screens/cart";
import { ServicesOverviewScreen } from "../screens/services";
import { AccountingDashboardScreen } from "../screens/accounting/AccountingDashboardScreen";

import { FloatingCartBar } from "../components/cart";

import { routes, RouteName, getTabsForRole } from "./routes";
import { MainTabParamList, RootStackParamList } from "./types";
import { TopBarConfig } from "./components/MainTabs/components/navigation.types";

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICON_XML: Partial<Record<RouteName, (color: string) => string>> = {
  [routes.DASHBOARD]: (color) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </svg>
  `,
  [routes.CART]: (color) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 7h12l-1 14H7L6 7Z" />
      <path d="M9 7V6a3 3 0 0 1 6 0v1" />
    </svg>
  `,
  [routes.SERVICES]: (color) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  `,
  [routes.ACCOUNTING]: (color) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 3v9h9" />
      <path d="M21 12a9 9 0 1 1-9-9" />
    </svg>
  `,
  [routes.STATS]: (color) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 20V10" />
      <path d="M12 20V4" />
      <path d="M19 20v-8" />
    </svg>
  `,
  [routes.PROFILE_TAB]: (color) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  `,
  [routes.USERS]: (color) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  `,
  [routes.VERIFICATIONS]: (color) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  `,
  [routes.COMPANIES]: (color) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 9h1" />
      <path d="M14 9h1" />
      <path d="M9 13h1" />
      <path d="M14 13h1" />
      <path d="M11 21v-4h2v4" />
    </svg>
  `,
  [routes.CHAT]: (color) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  `,
};

const getTabIconXml = (route: RouteName, color: string) => {
  const fn = TAB_ICON_XML[route];
  return fn ? fn(color) : "";
};

const PlaceholderScreen = ({ title, icon }: { title: string; icon: string }) => {
  const { colors } = useTheme();

  return (
    <View style={[placeholderStyles.container, { backgroundColor: colors.background }]}> 
      <LinearGradient colors={[colors.surfaceOverlayPrimary, "transparent"]} style={StyleSheet.absoluteFill} />
      <View style={placeholderStyles.content}>
        <Text style={placeholderStyles.icon}>{icon}</Text>
        <Text style={[placeholderStyles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[placeholderStyles.subtitle, { color: colors.textMuted }]}>Coming Soon</Text>
        <View style={[placeholderStyles.badge, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}> 
          <Text style={[placeholderStyles.badgeText, { color: colors.primary }]}>Under Development</Text>
        </View>
      </View>
    </View>
  );
};

const placeholderStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { alignItems: "center", gap: 12 },
  icon: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "800" },
  subtitle: { fontSize: 16, fontWeight: "600" },
  badge: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: "700" },
});

const ProfileTabScreen = () => <PlaceholderScreen title="Profile" icon="👤" />;

const screenRegistry: Record<RouteName, ComponentType> = {
  [routes.DASHBOARD]: DashboardScreen,
  [routes.CART]: AdminProductsScreen,
  [routes.SERVICES]: ServicesOverviewScreen,
  [routes.ACCOUNTING]: AccountingDashboardScreen,
  [routes.STATS]: StatsScreen,
  [routes.PROFILE_TAB]: ProfileTabScreen,
  [routes.USERS]: UserManagementScreen,
  [routes.VERIFICATIONS]: VerificationsScreen,
  [routes.COMPANIES]: CompaniesScreen,
  [routes.CHAT]: AdminChatScreen,
};

export const MainTabs = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRoute, setActiveRoute] = useState<RouteName>(routes.DASHBOARD);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [accountsPickerOpen, setAccountsPickerOpen] = useState(false);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);

  const { colors, spacing } = useTheme();
  const { user, logout, requestLogin } = useAuth();
  const { totalUnread } = useUnreadMessages();
  const { unreadCount: notificationUnreadCount } = useNotifications();
  const stackNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const userRole = (user?.role as "super-admin" | "admin" | "user" | "guest") || "guest";
  const isAdmin = isAdminRole(userRole);
  const isGuest = userRole === "guest";
  const isAuthenticated = Boolean(user) && !isGuest;

  useEffect(() => {
    let isMounted = true;
    const loadActiveCompany = async () => {
      if (!user?.activeCompany || !isAuthenticated) {
        if (isMounted) setActiveCompany(null);
        return;
      }
      try {
        const response = await companyService.get(String(user.activeCompany));
        if (isMounted) setActiveCompany(response.company);
      } catch {
        if (isMounted) setActiveCompany(null);
      }
    };

    loadActiveCompany();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.activeCompany]);

  const tabs = useMemo(() => getTabsForRole(userRole), [userRole]);

  const activeRouteForNav = useMemo(() => {
    if (!isAdmin && activeRoute === routes.STATS) return routes.ACCOUNTING;
    return activeRoute;
  }, [activeRoute, isAdmin]);

  const activeTabConfig = useMemo(() => {
    if (!tabs.length) return null;
    return tabs.find((tab) => tab.route === activeRouteForNav) ?? tabs.find((tab) => tab.route === activeRoute) ?? tabs[0];
  }, [activeRoute, activeRouteForNav, tabs]);

  const isInventoryShortcutOpen = !isAdmin && activeRoute === routes.STATS;
  const topBarMode = isInventoryShortcutOpen ? "two_row" : activeTabConfig?.topBarMode ?? "two_row";
  const topBarTitle = isInventoryShortcutOpen
    ? "Inventory"
    : activeTabConfig?.tabLabel ?? activeTabConfig?.label ?? (isAdmin ? "Dashboard" : "Home");

  const topBarSubtitle = useMemo(() => {
    if (topBarMode !== "two_row") return undefined;
    if (!isAuthenticated) return "Guest workspace";
    if (activeCompany?.displayName) return activeCompany.displayName;
    return isAdmin ? "Admin workspace" : "Operations workspace";
  }, [activeCompany?.displayName, isAdmin, isAuthenticated, topBarMode]);

  const topBarConfig = useMemo<TopBarConfig>(
    () => ({
      mode: topBarMode,
      title: topBarTitle,
      subtitle: topBarSubtitle,
      showSearch: topBarMode === "two_row",
    }),
    [topBarMode, topBarTitle, topBarSubtitle]
  );

  const displayName = useMemo(() => {
    if (typeof user?.displayName === "string" && user.displayName.trim().length) {
      return user.displayName;
    }
    return isAdmin ? "Admin" : "Operator";
  }, [isAdmin, user?.displayName]);

  const handleSearchPress = useCallback(() => {
    stackNavigation.navigate("ProductSearch", { initialQuery: searchQuery.trim() || undefined });
    setSearchQuery("");
  }, [searchQuery, stackNavigation]);

  const handleNavigateToRoute = useCallback(
    (route: RouteName) => {
      if (!isAdmin && route === routes.ACCOUNTING) {
        setSidebarVisible(false);
        setAccountsPickerOpen(true);
        return;
      }

      if (route === routes.PROFILE_TAB) {
        if (!isAuthenticated) {
          requestLogin();
          return;
        }
        if (activeCompany?.id) {
          stackNavigation.navigate("CompanyProfile", { companyId: String(activeCompany.id) });
        } else {
          setCompanyModalOpen(true);
        }
        return;
      }

      stackNavigation.navigate("Main", { screen: route });
      setSidebarVisible(false);
    },
    [activeCompany?.id, isAdmin, isAuthenticated, requestLogin, stackNavigation]
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
    stackNavigation.navigate("Appearance");
  }, [stackNavigation]);

  const handleNotificationStudio = useCallback(() => {
    setSidebarVisible(false);
    if (isAdmin) {
      stackNavigation.navigate("NotificationStudio");
      return;
    }
    stackNavigation.navigate("NotificationPreferences");
  }, [isAdmin, stackNavigation]);

  const handleHelp = useCallback(() => {
    setSidebarVisible(false);
    stackNavigation.navigate("Help");
  }, [stackNavigation]);

  const handleLogout = useCallback(async () => {
    setSidebarVisible(false);
    await logout();
  }, [logout]);

  const handleOpenCompanySwitcher = useCallback(() => {
    if (!isAuthenticated) {
      requestLogin();
      return;
    }
    setCompanyModalOpen(true);
  }, [isAuthenticated, requestLogin]);

  const handleOpenPersonalProfile = useCallback(() => {
    if (!isAuthenticated) {
      requestLogin();
      return;
    }
    if (isAdmin) return;
    stackNavigation.navigate("Profile");
  }, [isAdmin, isAuthenticated, requestLogin, stackNavigation]);

  const handleOpenNotifications = useCallback(() => {
    if (!isAuthenticated) {
      requestLogin();
      return;
    }
    stackNavigation.navigate("Notifications");
  }, [isAuthenticated, requestLogin, stackNavigation]);

  const navigationItems = useMemo(
    () =>
      tabs
        .filter((tab) => !tab.isPlaceholder)
        .map((tab) => ({
          label: tab.label,
          description: activeRouteForNav === tab.route ? "Currently viewing" : undefined,
          isActive: activeRouteForNav === tab.route,
          onPress: () => handleNavigateToRoute(tab.route),
        })),
    [activeRouteForNav, handleNavigateToRoute, tabs]
  );

  const profileOrLoginItem = isAuthenticated
    ? { label: "Profile", description: "Manage your personal details", onPress: handleShowProfile }
    : {
        label: "Login",
        description: "Access your workspace",
        onPress: () => {
          setSidebarVisible(false);
          requestLogin();
        },
      };

  const menuItems = useMemo(() => {
    const hasServicesTab = tabs.some((tab) => tab.route === routes.SERVICES);
    return [
      ...navigationItems,
      ...(hasServicesTab ? [] : [{ label: "Help", description: "Services and support", onPress: handleHelp }]),
      profileOrLoginItem,
      { label: "Preferences", description: "Theme, notifications, and more", onPress: handlePreferences },
      {
        label: isAdmin ? "Notification Studio" : "Notification Settings",
        description: isAdmin ? "Dispatch and track notifications" : "Manage push and quiet hours",
        onPress: handleNotificationStudio,
      },
      ...(isAuthenticated
        ? [{ label: "Logout", description: "Sign out of the workspace", onPress: handleLogout, tone: "danger" as const }]
        : []),
    ];
  }, [handleHelp, handleLogout, handleNotificationStudio, handlePreferences, isAdmin, isAuthenticated, navigationItems, profileOrLoginItem, tabs]);

  const closeCompanyModal = useCallback(() => setCompanyModalOpen(false), []);

  const handleAddCompany = useCallback(() => {
    closeCompanyModal();
    stackNavigation.navigate("CompanyCreate");
  }, [closeCompanyModal, stackNavigation]);

  return (
    <>
      <LinearGradient
        colors={[colors.surfaceCanvasStart, colors.surfaceCanvasMid, colors.surfaceCanvasEnd]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        <LinearGradient
          colors={[colors.surfaceOverlayPrimary, "transparent", colors.surfaceOverlaySecondary]}
          locations={[0, 0.58, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <HomeToolbar
          mode={topBarConfig.mode}
          title={topBarConfig.title}
          subtitle={topBarConfig.subtitle}
          showSearch={topBarConfig.showSearch}
          onMenuPress={() => setSidebarVisible(true)}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchPress={handleSearchPress}
          onNotificationsPress={handleOpenNotifications}
          notificationCount={notificationUnreadCount}
          activeCompany={activeCompany}
          onAvatarLongPress={handleOpenCompanySwitcher}
          onAvatarPress={handleOpenPersonalProfile}
        />

        <View style={styles.contentArea}>
          <Tab.Navigator
            initialRouteName={routes.DASHBOARD}
            screenOptions={{ headerShown: false }}
            screenListeners={({ route }) => ({
              focus: () => setActiveRoute(route.name as RouteName),
            })}
            tabBar={() => null}
          >
            {tabs.map((tab) => {
              const ScreenComponent = screenRegistry[tab.route];
              return <Tab.Screen key={tab.route} name={tab.route} component={ScreenComponent} options={{ title: tab.label }} />;
            })}
            {!isAdmin && !tabs.some((tab) => tab.route === routes.STATS) ? (
              <Tab.Screen name={routes.STATS} component={screenRegistry[routes.STATS]} options={{ title: "Inventory" }} />
            ) : null}
          </Tab.Navigator>
        </View>

        {!isAdmin && !isGuest ? <FloatingCartBar /> : null}

        <FooterRail
          tabs={tabs}
          activeTab={activeRouteForNav}
          onTabPress={handleNavigateToRoute}
          onTabLongPress={(route) => {
            if (route === routes.PROFILE_TAB) {
              handleOpenCompanySwitcher();
            }
          }}
          unreadByRoute={isAdmin ? { [routes.CHAT]: totalUnread } : undefined}
          getSvgIconXml={getTabIconXml}
        />
      </LinearGradient>

      <SidebarMenu
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        headerTitle={displayName}
        headerSubtitle={user?.email}
        menuItems={menuItems}
      />

      <Modal visible={accountsPickerOpen} transparent animationType="fade" onRequestClose={() => setAccountsPickerOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setAccountsPickerOpen(false)}>
          <View style={[styles.modalBackdrop, { backgroundColor: colors.modalBackdrop }]}> 
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={[
                  styles.accountsSheet,
                  {
                    backgroundColor: colors.surfaceLight,
                    borderColor: colors.border,
                    paddingTop: spacing.md,
                    paddingHorizontal: spacing.md,
                    paddingBottom: spacing.md + insets.bottom,
                  },
                ]}
              >
                <View style={styles.accountsSheetHeader}>
                  <View style={{ gap: 2 }}>
                    <Text style={[styles.accountsSheetTitle, { color: colors.textOnLightSurface }]}>Accounts</Text>
                    <Text style={[styles.accountsSheetSubtitle, { color: colors.subtextOnLightSurface }]}>Choose what you want to open</Text>
                  </View>
                  <TouchableOpacity onPress={() => setAccountsPickerOpen(false)} activeOpacity={0.8}>
                    <Text style={[styles.accountsSheetClose, { color: colors.textOnLightSurface }]}>Close</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ gap: 10, marginTop: spacing.sm }}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      setAccountsPickerOpen(false);
                      stackNavigation.navigate("Main", { screen: routes.ACCOUNTING });
                    }}
                    style={[styles.accountsSheetOption, { borderColor: colors.border, backgroundColor: colors.surfaceLightSoft }]}
                  >
                    <View style={[styles.accountsSheetOptionIcon, { backgroundColor: colors.surfaceElevated }]}> 
                      <SvgXml xml={getTabIconXml(routes.ACCOUNTING, colors.textOnLightSurface)} width={24} height={24} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.accountsSheetOptionTitle, { color: colors.textOnLightSurface }]}>Accounting</Text>
                      <Text style={[styles.accountsSheetOptionDesc, { color: colors.subtextOnLightSurface }]}>Dashboard, reports, vouchers</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      setAccountsPickerOpen(false);
                      stackNavigation.navigate("Main", { screen: routes.STATS });
                    }}
                    style={[styles.accountsSheetOption, { borderColor: colors.border, backgroundColor: colors.surfaceLightSoft }]}
                  >
                    <View style={[styles.accountsSheetOptionIcon, { backgroundColor: colors.surfaceElevated }]}> 
                      <SvgXml xml={getTabIconXml(routes.STATS, colors.textOnLightSurface)} width={24} height={24} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.accountsSheetOptionTitle, { color: colors.textOnLightSurface }]}>Inventory</Text>
                      <Text style={[styles.accountsSheetOptionDesc, { color: colors.subtextOnLightSurface }]}>Stock insights, products, low stock</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={companyModalOpen} animationType="slide" onRequestClose={closeCompanyModal} transparent>
        <TouchableWithoutFeedback onPress={closeCompanyModal}>
          <View style={[styles.modalBackdrop, { backgroundColor: colors.modalBackdrop }]}> 
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: 18, padding: spacing.md, borderColor: colors.border }]}> 
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Switch company</Text>
                  <TouchableOpacity onPress={closeCompanyModal}>
                    <Text style={{ color: colors.textSecondary, fontWeight: "700" }}>Close</Text>
                  </TouchableOpacity>
                </View>
                <CompanySwitcherCard
                  onSwitched={() => {
                    closeCompanyModal();
                    handleNavigateToRoute(routes.DASHBOARD);
                  }}
                  onAddCompany={handleAddCompany}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentArea: { flex: 1 },

  modalBackdrop: { flex: 1, justifyContent: "flex-end" },
  modalContent: { maxHeight: "80%", borderWidth: 1, width: "100%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: "800" },

  accountsSheet: {
    width: "100%",
    borderWidth: 1,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  accountsSheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  accountsSheetTitle: { fontSize: 16, fontWeight: "900", letterSpacing: -0.2 },
  accountsSheetSubtitle: { fontSize: 13, fontWeight: "600" },
  accountsSheetClose: { fontSize: 13, fontWeight: "800" },
  accountsSheetOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  accountsSheetOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  accountsSheetOptionTitle: { fontSize: 15, fontWeight: "800" },
  accountsSheetOptionDesc: { fontSize: 13, fontWeight: "600" },
});

export const UserTabs = MainTabs;
