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
import { Company } from "../types/company";
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
  const [companyVisual, setCompanyVisual] = useState<{ logoUrl?: string; initials: string }>({ initials: "CO" });
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
          setCompanyVisual({ logoUrl: active.logoUrl, initials: initials || buildInitials() });
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
      setCompanyVisual({ logoUrl: company.logoUrl, initials: initials || buildInitials() });
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
          activeRoute={activeRoute}
          onHome={() => handleNavigateToRoute(routes.DASHBOARD)}
          onSearch={() => Alert.alert("Search", "Search will launch a global workspace search soon.")}
          onCreate={openCompanyModal}
          onCompanyPress={() => stackNavigation.navigate("CompanyProfile")}
          onCompanyLongPress={openCompanyModal}
          companyVisual={companyVisual}
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

const FooterBar = ({
  activeRoute,
  onHome,
  onSearch,
  onCreate,
  onCompanyPress,
  onCompanyLongPress,
  companyVisual,
}: {
  activeRoute: RouteName;
  onHome: () => void;
  onSearch: () => void;
  onCreate: () => void;
  onCompanyPress: () => void;
  onCompanyLongPress: () => void;
  companyVisual: { logoUrl?: string; initials: string };
}) => {
  const { colors, spacing, radius } = useTheme();

  const renderButton = (label: string, onPress: () => void, bg?: string, active?: boolean) => {
    if (active) {
      return (
        <TouchableOpacity onPress={onPress} style={styles.footerButton}>
          <LinearGradient
            colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: radius.xl,
              paddingHorizontal: 14,
              paddingVertical: 10,
              shadowColor: colors.shadowGlow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 15,
              elevation: 8,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", textAlign: "center" }}>{label}</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.footerButton,
          {
            backgroundColor: bg ?? "transparent",
            borderRadius: radius.md,
          },
        ]}
      >
        <Text style={{ color: colors.textMuted, fontSize: 18, fontWeight: "700" }}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "transparent" }}>
      <LinearGradient
        colors={[
          "#1E2127",           // Elevated surface
          "#16181D",           // Surface
          "#12141A",           // Darker base
        ]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.footer,
          {
            paddingHorizontal: spacing.md,
            paddingTop: spacing.lg,
            paddingBottom: spacing.xs,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            borderTopWidth: 1,
            borderTopColor: "rgba(108, 99, 255, 0.15)",
          },
        ]}
      >
        {/* Subtle indigo glow on footer */}
        <LinearGradient
          colors={[
            "rgba(108, 99, 255, 0.08)",
            "transparent",
            "rgba(74, 201, 255, 0.05)",
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}
        />
        {renderButton("⌂", onHome, undefined, activeRoute === routes.DASHBOARD)}
        {renderButton("🔍", onSearch)}
        {renderButton("+", onCreate)}
        <TouchableOpacity
          onPress={onCompanyPress}
          onLongPress={onCompanyLongPress}
          style={[
            styles.companyPill,
            {
              borderColor: companyVisual.logoUrl ? "transparent" : "rgba(108, 99, 255, 0.4)",
              borderWidth: companyVisual.logoUrl ? 0 : 1,
              backgroundColor: "rgba(22, 24, 29, 0.8)",
              borderRadius: radius.pill,
            },
          ]}
        >
          {companyVisual.logoUrl ? (
            <Image source={{ uri: companyVisual.logoUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} resizeMode="cover" />
          ) : (
            <Text style={{ color: colors.textSecondary, fontWeight: "800", fontSize: 14 }}>{companyVisual.initials}</Text>
          )}
        </TouchableOpacity>
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
    justifyContent: "space-between",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  footerButton: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  companyPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
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
