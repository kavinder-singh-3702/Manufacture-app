import { ComponentType, useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Modal, Text, TouchableWithoutFeedback, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";
import { useThemeMode } from "../hooks/useThemeMode";
import { useAuth } from "../hooks/useAuth";
import { useUnreadMessages } from "../providers/UnreadMessagesProvider";
import { useNotifications } from "../providers/NotificationsProvider";
import { SidebarMenu } from "../components/navigation/SidebarMenu";
import { HomeToolbar } from "./components/MainTabs/components/HomeToolbar";
import { CompanySwitcherCard } from "../components/company";
import { AppRole } from "../constants/roles";
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
import { SvgXml } from "react-native-svg";

import { routes, RouteName, getTabsForRole, RouteConfig } from "./routes";
import { MainTabParamList, RootStackParamList } from "./types";

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
};

const getTabIconXml = (route: RouteName, color: string) => {
  const fn = TAB_ICON_XML[route];
  return fn ? fn(color) : "";
};

const footerIcons: Partial<Record<RouteName, { type: "svg"; xml: string } | { type: "png"; src: any }>> = {
  [routes.DASHBOARD]: {
    type: "svg",
    xml: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48"><path fill="rgba(255,255,255,0.75)" d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-4v-6h-4v6H4a1 1 0 0 1-1-1Z"/></svg>`,
  },
  [routes.CART]: {
    type: "svg",
    xml: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48"><path fill="rgba(255,255,255,0.8)" d="M7.2 6H20a1 1 0 0 1 .96 1.27l-1.75 6A1 1 0 0 1 18.25 14H9.1l-.35 1.38a1 1 0 0 1-.97.74H5a1 1 0 1 1 0-2h1.16l1.6-6.31A1 1 0 0 1 7.2 6Zm1.8 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm9 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/></svg>`,
  },
  [routes.SERVICES]: { type: "png", src: require("../../assets/footer/services.png") },
  [routes.ACCOUNTING]: {
    type: "svg",
    xml: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48"><path fill="rgba(255,255,255,0.75)" d="M7 3h8.5L19 6.5V21a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm8 1.5V7h2.5L15 4.5Z"/><path fill="rgba(255,255,255,0.55)" d="M8 10h8v1.6H8V10Zm0 3.2h8v1.6H8v-1.6Zm0 3.2h6v1.6H8V16.4Z"/></svg>`,
  },
  [routes.STATS]: { type: "png", src: require("../../assets/footer/stats.png") },
  [routes.PROFILE_TAB]: { type: "png", src: require("../../assets/footer/profile.png") },
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

  const { colors, spacing, radius } = useTheme();
  const { user, logout, requestLogin } = useAuth();
  const { unreadCount: notificationUnreadCount } = useNotifications();
  const stackNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const userRole = (user?.role as "admin" | "user" | "guest") || "guest";
  const isAdmin = userRole === AppRole.ADMIN;
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
      ...(isAuthenticated
        ? [{ label: "Logout", description: "Sign out of the workspace", onPress: handleLogout, tone: "danger" as const }]
        : []),
    ];
  }, [handleHelp, handleLogout, handlePreferences, isAuthenticated, navigationItems, profileOrLoginItem, tabs]);

  const closeCompanyModal = useCallback(() => setCompanyModalOpen(false), []);

  const handleAddCompany = useCallback(() => {
    closeCompanyModal();
    stackNavigation.navigate("CompanyCreate");
  }, [closeCompanyModal, stackNavigation]);

  const gradientOverlay = isAdmin
    ? { primary: "rgba(139, 92, 246, 0.15)", secondary: "rgba(236, 72, 153, 0.08)" }
    : { primary: colors.surfaceOverlayPrimary, secondary: colors.surfaceOverlaySecondary };

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
          colors={[gradientOverlay.primary, gradientOverlay.primary.replace("0.15", "0.04").replace("0.12", "0.04"), "transparent"]}
          locations={[0, 0.4, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 0.6 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={["transparent", gradientOverlay.secondary, "transparent"]}
          locations={[0, 0.5, 1]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.3, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        {!isAdmin ? (
          <LinearGradient
            colors={["transparent", colors.surfaceOverlayAccent.replace("0.10", "0.06"), colors.surfaceOverlayAccent]}
            locations={[0, 0.6, 1]}
            start={{ x: 0.4, y: 0.4 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}

        <HomeToolbar
          onMenuPress={() => setSidebarVisible(true)}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchPress={handleSearchPress}
          onNotificationsPress={() => stackNavigation.navigate("Notifications")}
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

        {isAdmin ? (
          <AdminFooterBar tabs={tabs} activeTab={activeRoute} onTabPress={handleNavigateToRoute} />
        ) : (
          <UserFooterBar
            tabs={tabs}
            activeTab={activeRouteForNav}
            onTabPress={handleNavigateToRoute}
            onProfileLongPress={handleOpenCompanySwitcher}
          />
        )}
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

type FooterBarProps = {
  tabs: RouteConfig[];
  activeTab: RouteName;
  onTabPress: (route: RouteName) => void;
  onProfileLongPress?: () => void;
};

const UserFooterBar = ({ tabs, activeTab, onTabPress, onProfileLongPress }: FooterBarProps) => {
  const { colors } = useTheme();
  const { resolvedMode } = useThemeMode();
  const footerBackground = resolvedMode === "dark" ? colors.backgroundSecondary : colors.footerBackground;
  const footerBorder = resolvedMode === "dark" ? "rgba(255,255,255,0.12)" : colors.footerBorder;

  const renderTab = (tab: RouteConfig) => {
    const isActive = activeTab === tab.route;
    const isProfileTab = tab.route === routes.PROFILE_TAB;
    const iconColor = isActive ? colors.footerActive : colors.footerInactive;
    const labelColor = isActive ? colors.footerActive : colors.footerInactive;

    return (
      <TouchableOpacity
        key={tab.route}
        onPress={() => onTabPress(tab.route)}
        onLongPress={isProfileTab && onProfileLongPress ? onProfileLongPress : undefined}
        delayLongPress={300}
        style={styles.simpleTabButton}
        activeOpacity={0.75}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {getTabIconXml(tab.route, iconColor) ? <SvgXml xml={getTabIconXml(tab.route, iconColor)} width={26} height={26} /> : <Text>{tab.icon}</Text>}
        <Text style={[styles.simpleTabLabel, { color: labelColor, fontWeight: isActive ? "800" : "600" }]} numberOfLines={1}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={["bottom"]} style={{ backgroundColor: footerBackground }}>
      <View style={[styles.simpleFooter, { borderTopColor: footerBorder, backgroundColor: footerBackground }]}>{tabs.map(renderTab)}</View>
    </SafeAreaView>
  );
};

const AdminFooterBar = ({ tabs, activeTab, onTabPress }: FooterBarProps) => {
  const { colors, spacing, radius } = useTheme();
  const { resolvedMode } = useThemeMode();
  const { totalUnread } = useUnreadMessages();
  const footerBase = resolvedMode === "dark" ? colors.backgroundSecondary : colors.surface;
  const footerAccent = resolvedMode === "dark" ? colors.surface : colors.backgroundSecondary;

  const renderIcon = (tab: RouteConfig, isActive: boolean) => {
    const asset = footerIcons[tab.route];
    if (asset?.type === "svg") {
      return <SvgXml xml={asset.xml} width={24} height={24} />;
    }
    if (asset?.type === "png") {
      return <Image source={asset.src} style={[styles.footerIcon, { opacity: isActive ? 1 : 0.85 }]} resizeMode="contain" />;
    }
    return <Text style={{ color: isActive ? colors.text : colors.textMuted }}>{tab.icon}</Text>;
  };

  const renderTab = (tab: RouteConfig) => {
    const isActive = activeTab === tab.route;
    const unreadCount = tab.route === routes.CHAT ? totalUnread : 0;

    return (
      <TouchableOpacity key={tab.route} onPress={() => onTabPress(tab.route)} style={styles.tabButton} activeOpacity={0.7}>
        {isActive ? (
          <View style={styles.activeTabContainer}>
            <View style={styles.adminTabIconWrap}>
              <LinearGradient
                colors={tab.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.activeTabGlow, { borderRadius: radius.lg, shadowColor: tab.gradientColors[0] }]}
              >
                {renderIcon(tab, true)}
              </LinearGradient>
              {unreadCount > 0 ? (
                <View style={[styles.adminUnreadBadge, { borderColor: colors.background }]}> 
                  <Text style={styles.adminUnreadBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.tabLabelActive, { color: tab.gradientColors[0] }]}>{tab.label}</Text>
          </View>
        ) : (
          <View style={styles.inactiveTabContainer}>
            <View style={styles.adminTabIconWrap}>
              <LinearGradient
                colors={[`${tab.gradientColors[0]}40`, `${tab.gradientColors[1]}20`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.inactiveGradientBorder, { borderRadius: radius.lg }]}
              >
                <View style={[styles.inactiveIconInner, { borderRadius: radius.lg - 1.5, backgroundColor: colors.background }]}> 
                  {renderIcon(tab, false)}
                </View>
              </LinearGradient>
              {unreadCount > 0 ? (
                <View style={[styles.adminUnreadBadge, { borderColor: colors.background }]}> 
                  <Text style={styles.adminUnreadBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.tabLabel, { color: colors.textMuted }]}>{tab.label}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "transparent" }}>
      <LinearGradient
        colors={[footerBase, footerAccent, footerBase]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.footer,
          {
            paddingHorizontal: spacing.sm,
            paddingTop: spacing.md,
            paddingBottom: spacing.xs,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: colors.sidebarBorder,
          },
        ]}
      >
        <LinearGradient
          colors={[colors.surfaceOverlayPrimary, "transparent", colors.surfaceOverlayAccent]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}
        />
        {tabs.map(renderTab)}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentArea: { flex: 1 },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  tabButton: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 4 },
  activeTabContainer: { alignItems: "center", justifyContent: "center", gap: 4 },
  inactiveTabContainer: { alignItems: "center", justifyContent: "center", gap: 4 },
  activeTabGlow: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  inactiveGradientBorder: { width: 46, height: 46, padding: 1.5, alignItems: "center", justifyContent: "center" },
  inactiveIconInner: { width: 43, height: 43, alignItems: "center", justifyContent: "center" },
  tabLabel: { fontSize: 12, fontWeight: "600" },
  tabLabelActive: { fontSize: 12, fontWeight: "700" },
  adminTabIconWrap: {
    position: "relative",
  },
  adminUnreadBadge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: "#FF4757",
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    shadowColor: "#FF4757",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  adminUnreadBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },

  footerIcon: { width: 22, height: 22 },

  simpleFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 6,
  },
  simpleTabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  simpleTabLabel: {
    marginTop: 4,
    fontSize: 13,
    letterSpacing: 0.2,
  },

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
