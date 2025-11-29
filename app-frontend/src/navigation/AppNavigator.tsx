import { useEffect, useMemo, useRef } from "react";
import { DefaultTheme, NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { enableScreens } from "react-native-screens";
import { AuthScreen } from "../screens/auth/AuthScreen";
import { useAuth } from "../hooks/useAuth";
import { FullScreenLoader } from "./components/FullScreenLoader";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { MainTabs } from "./MainTabs";
import { useTheme } from "../hooks/useTheme";
import { RootStackParamList } from "./types";
import { CompanyVerificationScreen } from "../screens/verification/CompanyVerificationScreen";
import { VerificationSubmitScreen } from "../screens/verification/VerificationSubmitScreen";
import { CompanyProfileScreen } from "../screens/company/CompanyProfileScreen";
import { CompanyCreateScreen } from "../screens/company/CompanyCreateScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { AddInventoryItemScreen, InventoryListScreen } from "../screens/inventory";

enableScreens(true);

const RootStack = createNativeStackNavigator<RootStackParamList>();

/**
 * AppNavigator - Main navigation container
 *
 * This component handles:
 * 1. Authentication state (showing Auth screen when not logged in)
 * 2. Role-based navigation is handled within MainTabs
 *
 * The navigation flow:
 * - Not authenticated → AuthScreen
 * - Authenticated → MainTabs (which shows role-appropriate tabs)
 */
export const AppNavigator = () => {
  const { user, initializing, pendingVerificationRedirect, clearPendingVerificationRedirect } = useAuth();
  const { colors } = useTheme();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        primary: colors.primary,
      },
    }),
    [colors]
  );

  // Redirect to verification screen after manufacturer/trader signup
  useEffect(() => {
    if (!pendingVerificationRedirect || !user) return;

    const timer = setTimeout(() => {
      navigationRef.current?.navigate("CompanyVerification", {
        companyId: pendingVerificationRedirect,
      });
      clearPendingVerificationRedirect();
    }, 100);

    return () => clearTimeout(timer);
  }, [pendingVerificationRedirect, user, clearPendingVerificationRedirect]);

  if (initializing) {
    return <FullScreenLoader />;
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
        {!user ? (
          // Not authenticated: Show login/signup screens
          <RootStack.Screen name="Auth" component={AuthScreen} />
        ) : (
          // Authenticated: Show unified MainTabs (role-based content handled inside)
          <>
            <RootStack.Screen name="Main" component={MainTabs} />
            <RootStack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ presentation: "modal", animation: "fade_from_bottom" }}
            />
            <RootStack.Screen
              name="CompanyProfile"
              component={CompanyProfileScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="CompanyCreate"
              component={CompanyCreateScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="CompanyVerification"
              component={CompanyVerificationScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
            <RootStack.Screen
              name="VerificationSubmit"
              component={VerificationSubmitScreen}
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <RootStack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <RootStack.Screen
              name="AddInventoryItem"
              component={AddInventoryItemScreen}
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <RootStack.Screen
              name="InventoryList"
              component={InventoryListScreen}
              options={{ presentation: "modal", animation: "slide_from_right" }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
