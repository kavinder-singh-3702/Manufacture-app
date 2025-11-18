import { useMemo } from "react";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { enableScreens } from "react-native-screens";
import { AuthScreen } from "../screens/auth/AuthScreen";
import { useAuth } from "../hooks/useAuth";
import { FullScreenLoader } from "./components/FullScreenLoader";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { MainTabs } from "./MainTabs";
import { useTheme } from "../hooks/useTheme";
import { RootStackParamList } from "./types";

enableScreens(true);

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { user, initializing } = useAuth();
  const { colors } = useTheme();

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

  if (initializing) {
    return <FullScreenLoader />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
        {!user ? (
          <RootStack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <RootStack.Screen name="Main" component={MainTabs} />
            <RootStack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ presentation: "modal", animation: "fade_from_bottom" }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
