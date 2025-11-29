import { ComponentType, useCallback, useMemo, useState } from "react";
import { View, StyleSheet, Alert, TouchableOpacity, Modal, Text, TouchableWithoutFeedback } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { SidebarMenu } from "../components/navigation/SidebarMenu";
import { HomeToolbar } from "./components/MainTabs/components/HomeToolbar";
import { CompanySwitcherCard } from "../components/company";
import { AppRole } from "../constants/roles";

// Screens
import { DashboardScreen } from "../screens/DashboardScreen";
import { StatsScreen } from "../screens/StatsScreen";
import { UserManagementScreen, VerificationsScreen, CompaniesScreen } from "../screens/admin";
import { CartScreen } from "../screens/cart";

// Hooks
import { useCart } from "../hooks/useCart";

// Navigation
import { routes, RouteName, getTabsForRole, RouteConfig } from "./routes";
import { MainTabParamList, RootStackParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

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
const ServicesScreen = () => <PlaceholderScreen title="Services" icon="🛎️" />;
const ProfileTabScreen = () => <PlaceholderScreen title="Profile" icon="👤" />;

/**
 * Screen registry - maps route names to their components
 */
const screenRegistry: Record<RouteName, ComponentType> = {
  // User screens
  [routes.DASHBOARD]: DashboardScreen,
  [routes.CART]: CartScreen,
  [routes.SERVICES]: ServicesScreen,
  [routes.STATS]: StatsScreen,
  [routes.PROFILE_TAB]: ProfileTabScreen,
  // Admin screens
  [routes.USERS]: UserManagementScreen,
  [routes.VERIFICATIONS]: VerificationsScreen,
  [routes.COMPANIES]: CompaniesScreen,
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

  const { colors, spacing } = useTheme();
  const { user, logout, requestLogin } = useAuth();
  const stackNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  // Determine user role for tab filtering
  const userRole = (user?.role as "admin" | "user" | "guest") || "guest";
  const isAdmin = userRole === AppRole.ADMIN;
  const isGuest = userRole === "guest";
  const isAuthenticated = Boolean(user) && !isGuest;

  // Get tabs for current user's role
  const tabs = useMemo(() => getTabsForRole(userRole), [userRole]);

  const displayName = useMemo(() => {
    if (typeof user?.displayName === "string" && user.displayName.trim().length) {
      return user.displayName;
    }
    return isAdmin ? "Admin" : "Operator";
  }, [user?.displayName, isAdmin]);

  const email = user?.email;

  const handleNavigateToRoute = useCallback(
    (route: RouteName) => {
      // Profile tab opens modal screen instead of tab
      if (route === routes.PROFILE_TAB) {
        if (!isAuthenticated) {
          requestLogin();
          return;
        }
        stackNavigation.navigate("Profile");
        return;
      }
      stackNavigation.navigate("Main", { screen: route });
      setSidebarVisible(false);
    },
    [isAuthenticated, requestLogin, stackNavigation]
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
      profileOrLoginItem,
      { label: "Preferences", description: "Theme, notifications, and more", onPress: handlePreferences },
      ...(isAuthenticated
        ? [{ label: "Logout", description: "Sign out of the workspace", onPress: handleLogout, tone: "danger" as const }]
        : []),
    ],
    [handleLogout, handlePreferences, isAuthenticated, navigationItems, profileOrLoginItem]
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
          onNotificationsPress={() => stackNavigation.navigate("Notifications")}
          notificationCount={isAdmin ? 5 : 3}
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

        {/* Different footer bar for admin vs user */}
        {isAdmin ? (
          <AdminFooterBar tabs={tabs} activeTab={activeRoute} onTabPress={handleNavigateToRoute} />
        ) : (
          <UserFooterBar tabs={tabs} activeTab={activeRoute} onTabPress={handleNavigateToRoute} />
        )}
      </LinearGradient>

      <SidebarMenu
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        headerTitle={displayName}
        headerSubtitle={email}
        menuItems={menuItems}
      />

      {/* Company switcher modal - only for non-admin users */}
      {!isAdmin && (
        <Modal visible={companyModalOpen} animationType="slide" onRequestClose={closeCompanyModal} transparent>
          <TouchableWithoutFeedback onPress={closeCompanyModal}>
            <View style={[styles.modalBackdrop, { backgroundColor: "rgba(0,0,0,0.25)" }]}>
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
      )}
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
};

const UserFooterBar = ({ tabs, activeTab, onTabPress }: FooterBarProps) => {
  const { colors, spacing } = useTheme();
  const { itemCount } = useCart();

  const renderTab = (tab: RouteConfig, index: number) => {
    const isActive = activeTab === tab.route;
    const isCenter = index === 2; // Services tab (center)
    const isCart = tab.route === routes.CART;
    const showBadge = isCart && itemCount > 0;

    if (isCenter) {
      // Center button - larger, always gradient
      return (
        <TouchableOpacity
          key={tab.route}
          onPress={() => onTabPress(tab.route)}
          style={styles.centerTabButton}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={tab.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.centerTabGradient}
          >
            <Text style={styles.centerTabIcon}>{tab.icon}</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={tab.route}
        onPress={() => onTabPress(tab.route)}
        style={styles.userTabButton}
        activeOpacity={0.7}
      >
        {isActive ? (
          <View style={styles.userActiveTabContainer}>
            <View>
              <LinearGradient
                colors={tab.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.userActiveTabGlow, { shadowColor: tab.gradientColors[0] }]}
              >
                <Text style={styles.userTabIcon}>{tab.icon}</Text>
              </LinearGradient>
              {showBadge && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{itemCount > 99 ? "99+" : itemCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.userTabLabelActive, { color: tab.gradientColors[0] }]}>{tab.label}</Text>
          </View>
        ) : (
          <View style={styles.userInactiveTabContainer}>
            <View>
              <LinearGradient
                colors={[`${tab.gradientColors[0]}30`, `${tab.gradientColors[1]}15`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.userInactiveGradientBorder}
              >
                <View style={[styles.userInactiveIconInner, { backgroundColor: colors.background }]}>
                  <Text style={styles.userTabIconInactive}>{tab.icon}</Text>
                </View>
              </LinearGradient>
              {showBadge && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{itemCount > 99 ? "99+" : itemCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.userTabLabel, { color: colors.textMuted }]}>{tab.label}</Text>
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
          styles.userFooter,
          {
            paddingHorizontal: spacing.xs,
            paddingTop: spacing.md,
            paddingBottom: spacing.xs,
          },
        ]}
      >
        {/* Subtle gradient overlay */}
        <LinearGradient
          colors={["rgba(0, 178, 255, 0.05)", "transparent", "rgba(255, 107, 107, 0.05)"]}
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
// ADMIN FOOTER BAR (4 tabs)
// ============================================================
const AdminFooterBar = ({ tabs, activeTab, onTabPress }: FooterBarProps) => {
  const { colors, spacing, radius } = useTheme();

  const renderTab = (tab: RouteConfig) => {
    const isActive = activeTab === tab.route;

    return (
      <TouchableOpacity
        key={tab.route}
        onPress={() => onTabPress(tab.route)}
        style={styles.tabButton}
        activeOpacity={0.7}
      >
        {isActive ? (
          <View style={styles.activeTabContainer}>
            <LinearGradient
              colors={tab.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.activeTabGlow, { borderRadius: radius.lg, shadowColor: tab.gradientColors[0] }]}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
            </LinearGradient>
            <Text style={[styles.tabLabelActive, { color: tab.gradientColors[0] }]}>{tab.label}</Text>
          </View>
        ) : (
          <View style={styles.inactiveTabContainer}>
            <LinearGradient
              colors={[`${tab.gradientColors[0]}40`, `${tab.gradientColors[1]}20`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.inactiveGradientBorder, { borderRadius: radius.lg }]}
            >
              <View style={[styles.inactiveIconInner, { borderRadius: radius.lg - 1.5, backgroundColor: colors.background }]}>
                <Text style={styles.tabIconInactive}>{tab.icon}</Text>
              </View>
            </LinearGradient>
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
  tabLabel: { fontSize: 10, fontWeight: "600" },
  tabLabelActive: { fontSize: 10, fontWeight: "700" },

  // User footer styles (5 tabs)
  userFooter: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  userTabButton: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 4 },
  userActiveTabContainer: { alignItems: "center", justifyContent: "center", gap: 3 },
  userInactiveTabContainer: { alignItems: "center", justifyContent: "center", gap: 3 },
  userActiveTabGlow: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  userInactiveGradientBorder: { width: 40, height: 40, borderRadius: 12, padding: 1.5, alignItems: "center", justifyContent: "center" },
  userInactiveIconInner: { width: 37, height: 37, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  userTabIcon: { fontSize: 20 },
  userTabIconInactive: { fontSize: 18, opacity: 0.7 },
  userTabLabel: { fontSize: 9, fontWeight: "600" },
  userTabLabelActive: { fontSize: 9, fontWeight: "700" },

  // Center button (Services)
  centerTabButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
    marginHorizontal: 4,
  },
  centerTabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ee0979",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.2)",
  },
  centerTabIcon: { fontSize: 26 },

  // Cart badge
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF4757",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#0F1115",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
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
