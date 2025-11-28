import { ComponentType, useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Alert, TouchableOpacity, Modal, Text, Image, TouchableWithoutFeedback, Vibration } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { SidebarMenu } from "../components/navigation/SidebarMenu";
import { DashboardScreen } from "../screens/DashboardScreen";
import { InventoryScreen } from "../screens/InventoryScreen";
import { RouteName, routes } from "./routes";
import { HomeToolbar } from "./components/MainTabs/components/HomeToolbar";
import { MainTabParamList, RootStackParamList, MAIN_TAB_ORDER } from "./types";
import { CompanySwitcherCard } from "../components/company";
import { Company, ComplianceStatus } from "../types/company";
import { companyService } from "../services/company.service";

const Tab = createBottomTabNavigator<MainTabParamList>();

const screenRegistry: Record<RouteName, ComponentType> = {
  [routes.DASHBOARD]: DashboardScreen,
  [routes.INVENTORY]: InventoryScreen,
};

export const MainTabs = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRoute, setActiveRoute] = useState<RouteName>(routes.DASHBOARD);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [companyVisual, setCompanyVisual] = useState<{
    logoUrl?: string;
    initials: string;
    complianceStatus?: ComplianceStatus;
    companyType?: Company["type"];
  }>({ initials: "CO" });
  const { colors, spacing } = useTheme();
  const { user, logout, requestLogin } = useAuth();
  const stackNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

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
        isActive: activeRoute === tab.route,
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

  const buildInitials = useCallback(() => {
    const label = user?.activeCompany ?? user?.displayName ?? user?.email ?? "CO";
    const trimmed = String(label).trim();
    if (!trimmed.length) return "CO";
    const tokens = trimmed.split(" ").filter(Boolean);
    if (tokens.length >= 2) return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
    if (trimmed.length >= 2) return trimmed.slice(0, 2).toUpperCase();
    return trimmed[0].toUpperCase();
  }, [user?.activeCompany, user?.displayName, user?.email]);

  useEffect(() => {
    setCompanyVisual((prev) => ({ ...prev, initials: buildInitials() }));
  }, [buildInitials]);

  useEffect(() => {
    if (!user) return;
    const loadActiveCompany = async () => {
      try {
        const response = await companyService.list();
        const active =
          response.companies.find((company) => company.id === user.activeCompany) ?? response.companies[0];
        if (active) {
          const initials = active.displayName
            ? active.displayName
              .split(" ")
              .filter(Boolean)
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
            : buildInitials();
          setCompanyVisual({
            logoUrl: active.logoUrl,
            initials: initials || buildInitials(),
            complianceStatus: active.complianceStatus,
            companyType: active.type,
          });
        }
      } catch {
        // Silent failure keeps initials fallback.
      }
    };
    loadActiveCompany();
  }, [buildInitials, user]);

  const openCompanyModal = useCallback(() => {
    Vibration.vibrate(10);
    setCompanyModalOpen(true);
  }, []);
  const closeCompanyModal = useCallback(() => setCompanyModalOpen(false), []);
  const handleAddCompany = useCallback(() => {
    closeCompanyModal();
    stackNavigation.navigate("CompanyCreate");
  }, [closeCompanyModal, stackNavigation]);

  const handleCompanyResolved = useCallback(
    (company: Company | null) => {
      if (!company) {
        setCompanyVisual({ initials: buildInitials() });
        return;
      }
      const initials = company.displayName?.trim()
        ? company.displayName
          .split(" ")
          .filter(Boolean)
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
        : buildInitials();
      setCompanyVisual({
        logoUrl: company.logoUrl,
        initials: initials || buildInitials(),
        complianceStatus: company.complianceStatus,
        companyType: company.type,
      });
    },
    [buildInitials]
  );

  return (
    <>
      <LinearGradient
        colors={[
          "#0F1115",      // Rich dark base
          "#101318",      // Subtle transition
          "#0F1115",      // Back to dark
        ]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        {/* Royal Indigo glow - top left corner */}
        <LinearGradient
          colors={[
            "rgba(108, 99, 255, 0.12)",   // Royal Indigo
            "rgba(108, 99, 255, 0.04)",
            "transparent",
          ]}
          locations={[0, 0.4, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 0.6 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Aqua Blue glow - top right */}
        <LinearGradient
          colors={[
            "transparent",
            "rgba(74, 201, 255, 0.08)",   // Aqua Blue
            "transparent",
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.3, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Muted Salmon glow - bottom right corner */}
        <LinearGradient
          colors={[
            "transparent",
            "rgba(255, 140, 60, 0.06)",   // Muted Salmon
            "rgba(255, 140, 60, 0.12)",
          ]}
          locations={[0, 0.6, 1]}
          start={{ x: 0.4, y: 0.4 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <HomeToolbar
          onMenuPress={() => setSidebarVisible(true)}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onNotificationsPress={() => stackNavigation.navigate("Notifications")}
          notificationCount={3}
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
            {MAIN_TAB_ORDER.map((tab) => {
              const ScreenComponent = screenRegistry[tab.route];
              return (
                <Tab.Screen key={tab.route} name={tab.route} component={ScreenComponent} options={{ title: tab.label }} />
              );
            })}
          </Tab.Navigator>
        </View>
        <FooterBar
          activeTab="home"
          onHomePress={() => handleNavigateToRoute(routes.DASHBOARD)}
          onCartPress={() => Alert.alert("E-Commerce", "Your cart and marketplace features coming soon!")}
          onServicesPress={() => Alert.alert("Services", "Help & support services coming soon!")}
          onStatsPress={() => Alert.alert("Statistics", "Business analytics dashboard coming soon!")}
          onProfilePress={() => stackNavigation.navigate("Profile")}
        />
      </LinearGradient>
      <SidebarMenu
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        headerTitle={displayName}
        headerSubtitle={email}
        menuItems={menuItems}
      />
      <Modal visible={companyModalOpen} animationType="slide" onRequestClose={closeCompanyModal} transparent>
        <TouchableWithoutFeedback onPress={closeCompanyModal}>
          <View style={[styles.modalBackdrop, { backgroundColor: "rgba(0,0,0,0.25)" }]}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: colors.surface,
                    borderRadius: 18,
                    padding: spacing.md,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Switch company</Text>
                  <TouchableOpacity onPress={closeCompanyModal}>
                    <Text style={{ color: colors.textSecondary, fontWeight: "700" }}>Close</Text>
                  </TouchableOpacity>
                </View>
                <CompanySwitcherCard
                  onActiveCompanyResolved={handleCompanyResolved}
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

type TabType = "home" | "cart" | "services" | "stats" | "profile";

const FooterBar = ({
  activeTab,
  onHomePress,
  onCartPress,
  onServicesPress,
  onStatsPress,
  onProfilePress,
}: {
  activeTab: TabType;
  onHomePress: () => void;
  onCartPress: () => void;
  onServicesPress: () => void;
  onStatsPress: () => void;
  onProfilePress: () => void;
}) => {
  const { colors, spacing, radius } = useTheme();

  const tabs: { id: TabType; icon: string; label: string; onPress: () => void; gradientColors: [string, string] }[] = [
    { id: "home", icon: "🏠", label: "Home", onPress: onHomePress, gradientColors: ["#FF6B6B", "#FF8E53"] },      // Red to Orange
    { id: "cart", icon: "🛒", label: "Cart", onPress: onCartPress, gradientColors: ["#FF4757", "#FF6348"] },      // Vibrant Red-Orange
    { id: "services", icon: "🛎️", label: "Services", onPress: onServicesPress, gradientColors: ["#ee0979", "#ff6a00"] }, // Pink to Orange
    { id: "stats", icon: "📊", label: "Stats", onPress: onStatsPress, gradientColors: ["#F97316", "#FBBF24"] },   // Orange to Amber
    { id: "profile", icon: "👤", label: "Profile", onPress: onProfilePress, gradientColors: ["#EC4899", "#F43F5E"] }, // Pink to Rose
  ];

  const renderTab = (tab: typeof tabs[0]) => {
    const isActive = activeTab === tab.id;

    return (
      <TouchableOpacity
        key={tab.id}
        onPress={tab.onPress}
        style={styles.tabButton}
        activeOpacity={0.7}
      >
        {isActive ? (
          <View style={styles.activeTabContainer}>
            {/* Gradient glow background */}
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
            {/* Gradient border for inactive tabs */}
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
        colors={[
          "rgba(30, 33, 39, 0.98)",
          "rgba(22, 24, 29, 0.98)",
          "rgba(18, 20, 26, 0.98)",
        ]}
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
            borderColor: "rgba(255,255,255,0.08)",
          },
        ]}
      >
        {/* Subtle gradient overlay */}
        <LinearGradient
          colors={[
            "rgba(0, 178, 255, 0.05)",
            "transparent",
            "rgba(255, 107, 107, 0.05)",
          ]}
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
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  // Tab button styles
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  activeTabContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  inactiveTabContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
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
  inactiveIconContainer: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  inactiveGradientBorder: {
    width: 46,
    height: 46,
    padding: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  inactiveIconInner: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIcon: {
    fontSize: 22,
  },
  tabIconInactive: {
    fontSize: 20,
    opacity: 0.7,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  tabLabelActive: {
    fontSize: 10,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    maxHeight: "80%",
    borderWidth: 1,
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
});
