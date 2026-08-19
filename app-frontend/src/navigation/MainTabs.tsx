import { ComponentType, useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import * as Haptics from "expo-haptics";
import { homeScrollY } from "./components/MainTabs/homeScrollState";
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
import {
  UserManagementScreen,
  VerificationsScreen,
  CompaniesScreen,
  AdminOpsConsoleScreen,
  CommandCenterScreen,
  AdminInventoryScreen,
  AdminOrdersScreen,
  AdminSettingsScreen,
} from "../screens/admin";
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
  [routes.OPS]: (color) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  `,
  [routes.INVENTORY]: (color) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  `,
  [routes.ORDERS]: (color) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  `,
  [routes.SETTINGS]: (color) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  `,
};

const getTabIconXml = (route: RouteName, color: string) => {
  const fn = TAB_ICON_XML[route];
  return fn ? fn(color) : "";
};

// Profile tab is a hub screen: tapping the tab in the footer already
// intercepts and navigates to Company/Personal Profile via
// handleNavigateToRoute. This backing screen exists so the tab has a
// real, functional render if the modal is dismissed or the intercept is
// bypassed — no "Coming Soon" / "Under Development" placeholder text
// (Apple rejects apps that surface those to the reviewer).
const ProfileTabScreen = () => {
  const { colors } = useTheme();
  const { user, requestLogin } = useAuth();
  const stackNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isAuthed = Boolean(user && user.role !== AppRole.GUEST);
  const displayName = user?.displayName || user?.email?.split("@")[0] || "there";
  const initial = (displayName[0] || "?").toUpperCase();

  return (
    <View style={[profileHubStyles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.surfaceOverlayPrimary, "transparent"]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={profileHubStyles.content}>
        <View style={[profileHubStyles.avatar, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "55" }]}>
          <Text style={[profileHubStyles.avatarText, { color: colors.primary }]}>{initial}</Text>
        </View>
        <Text style={[profileHubStyles.title, { color: colors.text }]}>
          {isAuthed ? `Hi, ${displayName}` : "Welcome"}
        </Text>
        <Text style={[profileHubStyles.subtitle, { color: colors.textMuted }]}>
          {isAuthed ? "Manage your account, company, and preferences" : "Sign in to manage your account and workspace"}
        </Text>

        {isAuthed ? (
          <View style={profileHubStyles.actions}>
            <TouchableOpacity
              style={[profileHubStyles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => stackNav.navigate("Profile")}
              activeOpacity={0.9}
            >
              <Text style={[profileHubStyles.primaryBtnText, { color: colors.textOnPrimary }]}>Open my profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[profileHubStyles.secondaryBtn, { borderColor: colors.border }]}
              onPress={() => stackNav.navigate("Notifications")}
              activeOpacity={0.9}
            >
              <Text style={[profileHubStyles.secondaryBtnText, { color: colors.text }]}>Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[profileHubStyles.secondaryBtn, { borderColor: colors.border }]}
              onPress={() => stackNav.navigate("NotificationPreferences")}
              activeOpacity={0.9}
            >
              <Text style={[profileHubStyles.secondaryBtnText, { color: colors.text }]}>Preferences</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={profileHubStyles.actions}>
            <TouchableOpacity
              style={[profileHubStyles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={requestLogin}
              activeOpacity={0.9}
            >
              <Text style={[profileHubStyles.primaryBtnText, { color: colors.textOnPrimary }]}>Sign in</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const profileHubStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  content: { alignItems: "center", gap: 10, maxWidth: 360, width: "100%" },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  avatarText: { fontSize: 32, fontWeight: "800" },
  title: { fontSize: 24, fontWeight: "800" },
  subtitle: { fontSize: 14, fontWeight: "600", textAlign: "center", lineHeight: 20 },
  actions: { marginTop: 20, width: "100%", gap: 10 },
  primaryBtn: { paddingVertical: 14, borderRadius: 32, alignItems: "center" },
  primaryBtnText: { fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
  secondaryBtn: { paddingVertical: 12, borderRadius: 32, alignItems: "center", borderWidth: 1 },
  secondaryBtnText: { fontSize: 14, fontWeight: "700" },
});

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
  // routes.OPS (admin "Ops" tab) points at CommandCenter — the new clean
  // Requests sub-tab replaces the messy AdminOpsConsoleScreen.
  [routes.OPS]: CommandCenterScreen,
  [routes.INVENTORY]: AdminInventoryScreen,
  [routes.ORDERS]: AdminOrdersScreen,
  [routes.SETTINGS]: AdminSettingsScreen,
};

export const MainTabs = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRoute, setActiveRoute] = useState<RouteName>(routes.DASHBOARD);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [accountsPickerOpen, setAccountsPickerOpen] = useState(false);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);

  const { colors, spacing, nativeGradients } = useTheme();
  const { user, logout, requestLogin, requestForgotPassword } = useAuth();
  const { totalUnread } = useUnreadMessages();
  const { unreadCount: notificationUnreadCount } = useNotifications();
  const stackNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (activeRoute === routes.DASHBOARD) {
      homeScrollY.setValue(0);
    }
  }, [activeRoute]);

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
  // Inventory has its own item search inside the screen, so the global
  // product search bar in the two-row top bar is redundant there.
  const topBarMode = isInventoryShortcutOpen ? "compact" : activeTabConfig?.topBarMode ?? "two_row";
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
        if (!isAuthenticated) {
          requestLogin();
          return;
        }
        if (!activeCompany?.id) {
          stackNavigation.navigate("CompanyContextPicker", {
            redirectTo: { kind: "main", screen: routes.ACCOUNTING },
            source: "Accounting",
          });
          return;
        }
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

  const handleSendFeedback = useCallback(() => {
    setSidebarVisible(false);
    if (!isAuthenticated) {
      requestLogin();
      return;
    }
    stackNavigation.navigate(isAdmin ? "FeedbackInbox" : "Feedback");
  }, [isAdmin, isAuthenticated, requestLogin, stackNavigation]);

  const handleModeration = useCallback(() => {
    setSidebarVisible(false);
    stackNavigation.navigate("ReportsInbox");
  }, [stackNavigation]);

  const handleLogout = useCallback(async () => {
    setSidebarVisible(false);
    await logout();
  }, [logout]);

  const handleForgotPassword = useCallback(async () => {
    setSidebarVisible(false);
    await requestForgotPassword();
  }, [requestForgotPassword]);

  const handleOpenCompanySwitcher = useCallback(() => {
    if (!isAuthenticated) {
      requestLogin();
      return;
    }
    // Medium-impact haptic on long-press matches iOS contextual menu
    // conventions and signals "you triggered a shortcut" — best-effort.
    Haptics.impactAsync(
      Platform.OS === "ios" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
    ).catch(() => undefined);
    setCompanyModalOpen(true);
  }, [isAuthenticated, requestLogin]);

  const handleOpenPersonalProfile = useCallback(() => {
    if (!isAuthenticated) {
      requestLogin();
      return;
    }
    stackNavigation.navigate("Profile");
  }, [isAuthenticated, requestLogin, stackNavigation]);

  const handleOpenNotifications = useCallback(() => {
    if (!isAuthenticated) {
      requestLogin();
      return;
    }
    stackNavigation.navigate("Notifications");
  }, [isAuthenticated, requestLogin, stackNavigation]);

  const handleAddProductFromTopBar = useCallback(() => {
    if (!isAuthenticated) {
      requestLogin();
      return;
    }
    stackNavigation.navigate("AddProduct");
  }, [isAuthenticated, requestLogin, stackNavigation]);

  const shouldShowAddProductAction = !isAdmin && activeRouteForNav === routes.DASHBOARD;
  const isTransparentToolbar = !isAdmin && activeRouteForNav === routes.DASHBOARD;

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
      {
        label: isAdmin ? "User Feedback" : "Send feedback",
        description: isAdmin
          ? "Review new and resolved feedback"
          : "Tell us what's working and what isn't",
        onPress: handleSendFeedback,
      },
      // Apple Guideline 1.2 — the in-app Report action has to route to a
      // queue a human actually reviews. Admin-only.
      ...(isAdmin
        ? [
            {
              label: "Moderation",
              description: "Review reported listings, messages, and users",
              onPress: handleModeration,
            },
          ]
        : []),
      ...(isAuthenticated
        ? [
            {
              label: "Forgot password",
              description: "Sign out and reset your password",
              onPress: handleForgotPassword,
            },
            { label: "Logout", description: "Sign out of the workspace", onPress: handleLogout, tone: "danger" as const },
          ]
        : []),
    ];
  }, [handleForgotPassword, handleHelp, handleLogout, handleModeration, handleNotificationStudio, handlePreferences, handleSendFeedback, isAdmin, isAuthenticated, navigationItems, profileOrLoginItem, tabs]);

  const closeCompanyModal = useCallback(() => setCompanyModalOpen(false), []);

  const handleAddCompany = useCallback(() => {
    closeCompanyModal();
    stackNavigation.navigate("CompanyCreate");
  }, [closeCompanyModal, stackNavigation]);

  return (
    <>
      <LinearGradient
        colors={nativeGradients.canvasSubtle}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, { paddingTop: 0 }]}
      >
        <LinearGradient
          colors={[colors.surfaceOverlayPrimary, "transparent", colors.surfaceOverlaySecondary]}
          locations={[0, 0.58, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {!isTransparentToolbar && (
          <LinearGradient
            colors={["#1B1464", "#2E3192", "#0071BC"]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingTop: insets.top }}
          >
            <HomeToolbar
              transparent
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
              showAddProductAction={shouldShowAddProductAction}
              onAddProductPress={handleAddProductFromTopBar}
              activeCompany={activeCompany}
              onAvatarLongPress={handleOpenCompanySwitcher}
              onAvatarPress={handleOpenPersonalProfile}
            />
          </LinearGradient>
        )}

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
            {/* Register old admin screens as hidden tabs so Settings can navigate to them */}
            {isAdmin && !tabs.some((tab) => tab.route === routes.USERS) ? (
              <Tab.Screen name={routes.USERS} component={screenRegistry[routes.USERS]} options={{ title: "Users" }} />
            ) : null}
            {isAdmin && !tabs.some((tab) => tab.route === routes.COMPANIES) ? (
              <Tab.Screen name={routes.COMPANIES} component={screenRegistry[routes.COMPANIES]} options={{ title: "Companies" }} />
            ) : null}
            {isAdmin && !tabs.some((tab) => tab.route === routes.VERIFICATIONS) ? (
              <Tab.Screen name={routes.VERIFICATIONS} component={screenRegistry[routes.VERIFICATIONS]} options={{ title: "Verifications" }} />
            ) : null}
            {isAdmin && !tabs.some((tab) => tab.route === routes.OPS) ? (
              <Tab.Screen name={routes.OPS} component={screenRegistry[routes.OPS]} options={{ title: "Ops" }} />
            ) : null}
          </Tab.Navigator>
        </View>

        {isTransparentToolbar && (
          <View style={[styles.transparentToolbarWrap, { paddingTop: insets.top + 6 }]}>
            <LinearGradient
              colors={["#1B1464", "#2E3192", "#0071BC"]}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <HomeToolbar
              mode={topBarConfig.mode}
              title={topBarConfig.title}
              subtitle={topBarConfig.subtitle}
              showSearch={topBarConfig.showSearch}
              transparent
              onMenuPress={() => setSidebarVisible(true)}
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              onSearchPress={handleSearchPress}
              onNotificationsPress={handleOpenNotifications}
              notificationCount={notificationUnreadCount}
              showAddProductAction={shouldShowAddProductAction}
              onAddProductPress={handleAddProductFromTopBar}
              activeCompany={activeCompany}
              onAvatarLongPress={handleOpenCompanySwitcher}
              onAvatarPress={handleOpenPersonalProfile}
            />
          </View>
        )}

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
          unreadByRoute={totalUnread > 0 && isAdmin ? { [routes.OPS]: totalUnread } : undefined}
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
                      <Text style={[styles.accountsSheetOptionDesc, { color: colors.subtextOnLightSurface }]}>Dashboard, reports and vouchers</Text>
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
                      <Text style={[styles.accountsSheetOptionDesc, { color: colors.subtextOnLightSurface }]}>Stock items, insights and low-stock queue</Text>
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
  transparentToolbarWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
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
