import { ComponentType, useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import {
  CompanyContextRedirectTarget,
  CompanyContextStackScreen,
  RootStackParamList,
} from "../types";

const AccessBlockedFallback = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.blockedContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="small" color={colors.primary} />
      <Text style={[styles.blockedText, { color: colors.textMuted }]}>Preparing company context…</Text>
    </View>
  );
};

const buildCurrentRedirect = (
  routeName: string,
  params: unknown,
  fallbackRedirect?: CompanyContextRedirectTarget
): CompanyContextRedirectTarget | undefined => {
  if (fallbackRedirect) return fallbackRedirect;

  const redirect: CompanyContextRedirectTarget = {
    kind: "stack",
    screen: routeName as CompanyContextStackScreen,
    params: (params as Record<string, unknown>) ?? undefined,
  };
  return redirect;
};

export const withCompanyContextGuard = <P extends object>(
  Component: ComponentType<P>,
  options?: { sourceLabel?: string; fallbackRedirect?: CompanyContextRedirectTarget }
) => {
  const GuardedScreen = (props: P) => {
    const { user } = useAuth();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute();
    const hasShownAlert = useRef(false);
    const hasCompany = Boolean(user?.activeCompany);

    const redirectTo = useMemo(
      () => buildCurrentRedirect(String(route.name), route.params, options?.fallbackRedirect),
      [route.name, route.params]
    );

    useEffect(() => {
      if (hasCompany || hasShownAlert.current) return;
      hasShownAlert.current = true;
      Alert.alert(
        "Company Required",
        "Select or create a company to continue this workflow."
      );
      navigation.replace("CompanyContextPicker", {
        redirectTo,
        source: options?.sourceLabel || String(route.name),
      });
    }, [hasCompany, navigation, redirectTo, route.name]);

    if (!hasCompany) {
      return <AccessBlockedFallback />;
    }

    return <Component {...props} />;
  };

  GuardedScreen.displayName = `withCompanyContextGuard(${
    Component.displayName || Component.name || "Screen"
  })`;

  return GuardedScreen;
};

const styles = StyleSheet.create({
  blockedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
  },
  blockedText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
