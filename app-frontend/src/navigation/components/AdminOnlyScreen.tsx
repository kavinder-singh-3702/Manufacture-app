import { ComponentType, useEffect, useRef } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { isAdminRole } from "../../constants/roles";
import { RootStackParamList } from "../types";
import { routes } from "../routes";

const AccessBlockedFallback = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.blockedContainer, { backgroundColor: colors.background }]}> 
      <ActivityIndicator size="small" color={colors.primary} />
      <Text style={[styles.blockedText, { color: colors.textMuted }]}>Redirecting to workspace…</Text>
    </View>
  );
};

export const withAdminGuard = <P extends object>(Component: ComponentType<P>) => {
  const GuardedScreen = (props: P) => {
    const { user } = useAuth();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const hasShownAlert = useRef(false);
    const isAllowed = isAdminRole(user?.role);

    useEffect(() => {
      if (isAllowed || hasShownAlert.current) return;
      hasShownAlert.current = true;
      Alert.alert("Admin Access Required", "This screen is available only to admin and super-admin accounts.");
      navigation.replace("Main", { screen: routes.DASHBOARD });
    }, [isAllowed, navigation]);

    if (!isAllowed) {
      return <AccessBlockedFallback />;
    }

    return <Component {...props} />;
  };

  GuardedScreen.displayName = `withAdminGuard(${Component.displayName || Component.name || "Screen"})`;

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
