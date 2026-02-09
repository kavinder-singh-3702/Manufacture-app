import { ComponentType, useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Alert, TouchableOpacity, Modal, Text, TouchableWithoutFeedback, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { useUnreadMessages } from "../providers/UnreadMessagesProvider";
import { useNotifications } from "../providers/NotificationsProvider";
import { SidebarMenu } from "../components/navigation/SidebarMenu";
import { HomeToolbar } from "./components/MainTabs/components/HomeToolbar";
import { CompanySwitcherCard } from "../components/company";
import { AppRole } from "../constants/roles";
import { companyService } from "../services/company.service";
import { Company } from "../types/company";
import { scale, moderateScale } from "../utils/responsive";

// Screens
import { DashboardScreen } from "../screens/DashboardScreen";
import { StatsScreen } from "../screens/StatsScreen";
import { UserManagementScreen, VerificationsScreen, CompaniesScreen } from "../screens/admin";
import { AdminChatScreen } from "../screens/chat";
import { AdminProductsScreen } from "../screens/cart";
import { ServicesOverviewScreen } from "../screens/services";
import { AccountingDashboardScreen } from "../screens/accounting/AccountingDashboardScreen";

// Components
import { FloatingCartBar } from "../components/cart";
import { SvgXml } from "react-native-svg";

// Navigation
import { routes, RouteName, getTabsForRole, RouteConfig } from "./routes";
import { MainTabParamList, RootStackParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

const homeIconXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48px" height="48px" baseProfile="basic"><linearGradient id="87AqUxYxn4hxYY6Pzo9b5a" x1="4.57" x2="19.43" y1="5.952" y2="20.813" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/></linearGradient><path fill="url(#87AqUxYxn4hxYY6Pzo9b5a)" d="M18,21H6c-1.657,0-3-1.343-3-3V8.765c0-1.09,0.591-2.093,1.543-2.622l6-3.333 c0.906-0.503,2.008-0.503,2.914,0l6,3.333C20.409,6.672,21,7.676,21,8.765V18C21,19.657,19.657,21,18,21z"/><linearGradient id="87AqUxYxn4hxYY6Pzo9b5b" x1="4.57" x2="19.43" y1="5.952" y2="20.813" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".493" stop-color="#fff" stop-opacity="0"/><stop offset=".997" stop-color="#fff" stop-opacity=".3"/></linearGradient><path fill="url(#87AqUxYxn4hxYY6Pzo9b5b)" d="M12,2.932 c0.424,0,0.844,0.109,1.214,0.315l6,3.333C20.007,7.02,20.5,7.858,20.5,8.765V18c0,1.378-1.122,2.5-2.5,2.5H6 c-1.379,0-2.5-1.122-2.5-2.5V8.765c0-0.907,0.493-1.745,1.286-2.185l6-3.333C11.156,3.041,11.576,2.932,12,2.932 M12,2.432 c-0.502,0-1.004,0.126-1.457,0.378l-6,3.333C3.591,6.672,3,7.676,3,8.765V18c0,1.657,1.343,3,3,3h12c1.657,0,3-1.343,3-3V8.765 c0-1.09-0.591-2.093-1.543-2.622l-6-3.333C13.004,2.558,12.502,2.432,12,2.432L12,2.432z"/><linearGradient id="87AqUxYxn4hxYY6Pzo9b5c" x1="8.793" x2="15.207" y1="14.379" y2="20.793" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".519" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity=".55"/></linearGradient><path fill="url(#87AqUxYxn4hxYY6Pzo9b5c)" d="M15,21H9v-6c0-1.105,0.895-2,2-2h2	c1.105,0,2,0.895,2,2V21z"/></svg>`;
const cartIconXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48px" height="48px"><defs><linearGradient id="cartGradient" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#22C55E" stop-opacity="0.95"/><stop offset="100%" stop-color="#16A34A" stop-opacity="0.85"/></linearGradient></defs><path fill="url(#cartGradient)" d="M7.2 6H20a1 1 0 0 1 .96 1.27l-1.75 6A1 1 0 0 1 18.25 14H9.1l-.35 1.38a1 1 0 0 1-.97.74H5a1 1 0 1 1 0-2h1.16l1.6-6.31A1 1 0 0 1 7.2 6Zm2.3 7h7.88l1.17-4H8.75l-.75 3h1.5ZM9 18a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm9 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/></svg>`;
const accountingIconXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48px" height="48px"><path fill="rgba(255,255,255,0.75)" d="M7 3h8.5L19 6.5V21a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm8 1.5V7h2.5L15 4.5Z"/><path fill="rgba(255,255,255,0.55)" d="M8 10h8v1.6H8V10Zm0 3.2h8v1.6H8v-1.6Zm0 3.2h6v1.6H8V16.4Z"/></svg>`;

const footerIcons: Partial<Record<RouteName, { type: "svg"; xml: string } | { type: "png"; src: any }>> = {
  [routes.DASHBOARD]: { type: "svg", xml: homeIconXml },
  [routes.CART]: { type: "svg", xml: cartIconXml },
  [routes.SERVICES]: { type: "png", src: require("../../assets/footer/services.png") },
  [routes.ACCOUNTING]: { type: "svg", xml: accountingIconXml },
  [routes.STATS]: { type: "png", src: require("../../assets/footer/stats.png") },
  [routes.PROFILE_TAB]: { type: "png", src: require("../../assets/footer/profile.png") },
};

// ============================================================
// PLACEHOLDER SCREEN (for Coming Soon tabs)
// ============================================================
const PlaceholderScreen = ({ title, icon }: { title: string; icon: string }) => {
  const { colors } = useTheme();

  return (
    <View style={[placeholderStyles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(108, 99, 255, 0.08)", "transparent"]}
        style={StyleSheet.absoluteFill}
      />
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

// Wrapper screens for placeholders
// ServicesScreen is now a real screen (UserServicesScreen) - no placeholder needed
const ProfileTabScreen = () => <PlaceholderScreen title="Profile" icon="👤" />;

/**
 * Screen registry - maps route names to their components
 */
const screenRegistry: Record<RouteName, ComponentType> = {
  // User screens
  [routes.DASHBOARD]: DashboardScreen,
  [routes.CART]: AdminProductsScreen,
  [routes.SERVICES]: ServicesOverviewScreen, // Services overview → detail flow
  [routes.ACCOUNTING]: AccountingDashboardScreen,
  [routes.STATS]: StatsScreen,
  [routes.PROFILE_TAB]: ProfileTabScreen,
  // Admin screens
  [routes.USERS]: UserManagementScreen,
  [routes.VERIFICATIONS]: VerificationsScreen,
  [routes.COMPANIES]: CompaniesScreen,
  [routes.CHAT]: AdminChatScreen, // Admin's chat screen (list of users to chat with)
};

/**
 * MainTabs - Unified navigation for all user roles
 * Shows different tabs based on user role (admin/user/guest)
 */
export const MainTabs = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRoute, setActiveRoute] = useState<RouteName>(routes.DASHBOARD);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);

  const { colors, spacing } = useTheme();
  const { user, logout, requestLogin } = useAuth();
  const { unreadCount: notificationUnreadCount } = useNotifications();
  const stackNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  // Determine user role for tab filtering
  const userRole = (user?.role as "admin" | "user" | "guest") || "guest";
  const isAdmin = userRole === AppRole.ADMIN;
  const isGuest = userRole === "guest";
  const isAuthenticated = Boolean(user) && !isGuest;

  // DEBUG: Log user info to understand role assignment
  console.log("[MainTabs] User:", { id: user?.id, role: user?.role, userRole, isAdmin, isAuthenticated });

  // Load active company metadata for avatar display
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
      } catch (err) {
        if (isMounted) setActiveCompany(null);
      }
    };

    loadActiveCompany();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.activeCompany]);

  // Get tabs for current user's role
  const tabs = useMemo(() => getTabsForRole(userRole), [userRole]);

  const displayName = useMemo(() => {
    if (typeof user?.displayName === "string" && user.displayName.trim().length) {
      return user.displayName;
    }
    return isAdmin ? "Admin" : "Operator";
  }, [user?.displayName, isAdmin]);

  const email = user?.email;
  const handleSearchPress = useCallback(() => {
    stackNavigation.navigate("ProductSearch", { initialQuery: searchQuery.trim() || undefined });
    setSearchQuery("");
  }, [searchQuery, stackNavigation]);

  const handleNavigateToRoute = useCallback(
    (route: RouteName) => {
      // Profile tab opens Company Profile screen instead of tab
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
    [activeCompany?.id, isAuthenticated, requestLogin, stackNavigation]
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

  const handleHelp = useCallback(() => {
    setSidebarVisible(false);
    stackNavigation.navigate("Help");
  }, [stackNavigation]);

  const handleLogout = useCallback(async () => {
    setSidebarVisible(false);
    await logout();
  }, [logout]);

  const handleOpenCompanySwitcher = useCallback(() => {
    console.log("[MainTabs] handleOpenCompanySwitcher called, isAdmin:", isAdmin, "isAuthenticated:", isAuthenticated);
    if (!isAuthenticated) {
      console.log("[MainTabs] Not authenticated - requesting login");
      requestLogin();
      return;
    }
    console.log("[MainTabs] Opening company switcher modal");
    setCompanyModalOpen(true);
  }, [isAdmin, isAuthenticated, requestLogin]);

  const handleOpenPersonalProfile = useCallback(() => {
    if (!isAuthenticated) {
      requestLogin();
      return;
    }
    if (isAdmin) return;
    stackNavigation.navigate("Profile");
  }, [isAdmin, isAuthenticated, requestLogin, stackNavigation]);

  // Build navigation items from tabs (exclude placeholders from sidebar)
  const navigationItems = useMemo(
    () =>
      tabs
        .filter((tab) => !tab.isPlaceholder)
        .map((tab) => ({
          label: tab.label,
          description: activeRoute === tab.route ? "Currently viewing" : undefined,
          isActive: activeRoute === tab.route,
          onPress: () => handleNavigateToRoute(tab.route),
        })),
    [activeRoute, handleNavigateToRoute, tabs]
  );

  const profileOrLoginItem = isAuthenticated
    ? { label: "Profile", description: "Manage your personal details", onPress: handleShowProfile }
    : { label: "Login", description: "Access your workspace", onPress: () => { setSidebarVisible(false); requestLogin(); } };

  const menuItems = useMemo(
    () => [
      ...navigationItems,
      { label: "Help", description: "Services and support", onPress: handleHelp },
      profileOrLoginItem,
      { label: "Preferences", description: "Theme, notifications, and more", onPress: handlePreferences },
      ...(isAuthenticated
        ? [{ label: "Logout", description: "Sign out of the workspace", onPress: handleLogout, tone: "danger" as const }]
        : []),
    ],
    [handleHelp, handleLogout, handlePreferences, isAuthenticated, navigationItems, profileOrLoginItem]
  );

  const closeCompanyModal = useCallback(() => setCompanyModalOpen(false), []);

  const handleAddCompany = useCallback(() => {
    closeCompanyModal();
    stackNavigation.navigate("CompanyCreate");
  }, [closeCompanyModal, stackNavigation]);

  // Gradient colors based on role
  const gradientOverlay = isAdmin
    ? { primary: "rgba(139, 92, 246, 0.15)", secondary: "rgba(236, 72, 153, 0.08)" }
    : { primary: "rgba(108, 99, 255, 0.12)", secondary: "rgba(74, 201, 255, 0.08)" };

  return (
    <>
      <LinearGradient
        colors={["#0F1115", "#101318", "#0F1115"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        {/* Role-based gradient overlay */}
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
        {!isAdmin && (
          <LinearGradient
            colors={["transparent", "rgba(255, 140, 60, 0.06)", "rgba(255, 140, 60, 0.12)"]}
            locations={[0, 0.6, 1]}
            start={{ x: 0.4, y: 0.4 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}

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
              return (
                <Tab.Screen key={tab.route} name={tab.route} component={ScreenComponent} options={{ title: tab.label }} />
              );
            })}
          </Tab.Navigator>
        </View>

        {/* Floating Cart Bar - shows above footer when items in cart (for non-admin users only) */}
        {!isAdmin && !isGuest && <FloatingCartBar />}

        {/* Different footer bar for admin vs user */}
        {isAdmin ? (
          <AdminFooterBar tabs={tabs} activeTab={activeRoute} onTabPress={handleNavigateToRoute} />
        ) : (
          <UserFooterBar tabs={tabs} activeTab={activeRoute} onTabPress={handleNavigateToRoute} onProfileLongPress={handleOpenCompanySwitcher} />
        )}
      </LinearGradient>

      <SidebarMenu
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        headerTitle={displayName}
        headerSubtitle={email}
        menuItems={menuItems}
      />

      {/* Company switcher modal - for all authenticated users */}
      <Modal visible={companyModalOpen} animationType="slide" onRequestClose={closeCompanyModal} transparent>
        <TouchableWithoutFeedback onPress={closeCompanyModal}>
          <View style={[styles.modalBackdrop, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: 18, padding: spacing.md, borderColor: colors.border }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Switch company</Text>
                  <TouchableOpacity onPress={closeCompanyModal}>
                    <Text style={{ color: colors.textSecondary, fontWeight: "700" }}>Close</Text>
                  </TouchableOpacity>
                </View>
                <CompanySwitcherCard
                  onSwitched={() => { closeCompanyModal(); handleNavigateToRoute(routes.DASHBOARD); }}
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

// ============================================================
// USER FOOTER BAR (5 tabs with gradient buttons)
// ============================================================
type FooterBarProps = {
  tabs: RouteConfig[];
  activeTab: RouteName;
  onTabPress: (route: RouteName) => void;
  onProfileLongPress?: () => void;
};

const UserFooterBar = ({ tabs, activeTab, onTabPress, onProfileLongPress }: FooterBarProps) => {
  const { colors, spacing } = useTheme();
  const { totalItems } = useCart();

  const renderIcon = (tab: RouteConfig, isActive: boolean) => {
    const asset = footerIcons[tab.route];
    if (asset?.type === "svg") {
      return <SvgXml xml={asset.xml} width={24} height={24} />;
    }
    if (asset?.type === "png") {
      return <Image source={asset.src} style={[styles.footerIcon, { opacity: isActive ? 1 : 0.8 }]} resizeMode="contain" />;
    }
    return <Text style={isActive ? styles.userTabIcon : styles.userTabIconInactive}>{tab.icon}</Text>;
  };

  const renderTab = (tab: RouteConfig) => {
    const isActive = activeTab === tab.route;
    const isProfileTab = tab.route === routes.PROFILE_TAB;

    return (
      <TouchableOpacity
        key={tab.route}
        onPress={() => onTabPress(tab.route)}
        onLongPress={isProfileTab && onProfileLongPress ? onProfileLongPress : undefined}
        delayLongPress={300}
        style={styles.userTabButton}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isActive ? tab.gradientColors : ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.02)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.userTabPill,
            {
              borderColor: isActive ? tab.gradientColors[0] + "55" : "rgba(255,255,255,0.06)",
              shadowColor: isActive ? tab.gradientColors[0] : "#000",
              backgroundColor: isActive ? undefined : colors.surface,
            },
          ]}
        >
          <View style={styles.userTabIconWrap}>
            {renderIcon(tab, isActive)}
            {isProfileTab && onProfileLongPress && (
              <View style={[styles.longPressHintBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.longPressHintBadgeText}>⇅</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.userTabLabelCommon,
              isActive ? { color: colors.text } : { color: colors.textMuted },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {tab.label}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "transparent" }}>
      <LinearGradient
        colors={["rgba(18,20,26,0.98)", "rgba(18,20,26,0.92)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.userFooter,
          {
            paddingHorizontal: spacing.sm,
            paddingTop: spacing.sm,
            paddingBottom: spacing.xs,
          },
        ]}
      >
        <LinearGradient
          colors={["rgba(108,99,255,0.08)", "transparent", "rgba(74,201,255,0.06)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 26, borderTopRightRadius: 26 }]}
        />
        {tabs.map(renderTab)}
      </LinearGradient>
    </SafeAreaView>
  );
};

// ============================================================
// ADMIN FOOTER BAR (4 tabs)
// ============================================================
const AdminFooterBar = ({ tabs, activeTab, onTabPress }: FooterBarProps) => {
  const { colors, spacing, radius } = useTheme();
  const { totalUnread } = useUnreadMessages();

  const renderIcon = (tab: RouteConfig, isActive: boolean) => {
    const asset = footerIcons[tab.route];
    if (asset?.type === "svg") {
      return <SvgXml xml={asset.xml} width={24} height={24} />;
    }
    if (asset?.type === "png") {
      return <Image source={asset.src} style={[styles.footerIcon, { opacity: isActive ? 1 : 0.85 }]} resizeMode="contain" />;
    }
    return <Text style={isActive ? styles.tabIcon : [styles.tabIcon, { color: colors.textMuted }]}>{tab.icon}</Text>;
  };

  const renderTab = (tab: RouteConfig) => {
    const isActive = activeTab === tab.route;
    const isChatTab = tab.route === routes.CHAT;
    const unreadCount = isChatTab ? totalUnread : 0;

    return (
      <TouchableOpacity
        key={tab.route}
        onPress={() => onTabPress(tab.route)}
        style={styles.tabButton}
        activeOpacity={0.7}
      >
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
              {unreadCount > 0 && (
                <View style={styles.adminUnreadBadge}>
                  <Text style={styles.adminUnreadBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
                </View>
              )}
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
              {unreadCount > 0 && (
                <View style={styles.adminUnreadBadge}>
                  <Text style={styles.adminUnreadBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
                </View>
              )}
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
        colors={["rgba(30, 33, 39, 0.98)", "rgba(22, 24, 29, 0.98)", "rgba(18, 20, 26, 0.98)"]}
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
            borderColor: "rgba(139, 92, 246, 0.2)",
          },
        ]}
      >
        {/* Admin purple gradient overlay */}
        <LinearGradient
          colors={["rgba(139, 92, 246, 0.1)", "transparent", "rgba(236, 72, 153, 0.08)"]}
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

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  contentArea: { flex: 1 },

  // Admin footer styles
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
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
  tabIcon: { fontSize: 22 },
  tabIconInactive: { fontSize: 20, opacity: 0.7 },
  tabLabel: { fontSize: 12, fontWeight: "600", textShadowColor: "rgba(0, 0, 0, 0.75)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  tabLabelActive: { fontSize: 12, fontWeight: "700", textShadowColor: "rgba(0, 0, 0, 0.75)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
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
    borderColor: "#0F1115",
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

  // User footer styles (5 tabs)
  userFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    gap: 8,
  },
  userTabButton: { flex: 1, alignItems: "center", justifyContent: "center" },
  userTabPill: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderWidth: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  userTabIconWrap: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  userTabIcon: { fontSize: 20 },
  userTabIconInactive: { fontSize: 18, opacity: 0.7 },
  userTabLabelCommon: { fontSize: 13, fontWeight: "700", letterSpacing: 0.2, textAlign: "center", textShadowColor: "rgba(0, 0, 0, 0.75)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  footerIcon: { width: 22, height: 22 },

  // Long press hint badge for company switcher
  longPressHintBadge: {
    position: "absolute",
    bottom: -4,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0F1115",
  },
  longPressHintBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },

  // Modal styles
  modalBackdrop: { flex: 1, justifyContent: "flex-end" },
  modalContent: { maxHeight: "80%", borderWidth: 1, width: "100%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: "800" },
});

// Legacy export
export const UserTabs = MainTabs;
