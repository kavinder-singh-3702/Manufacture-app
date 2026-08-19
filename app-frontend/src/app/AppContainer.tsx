import { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { rootNavigationRef } from "../navigation/navigationRef";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import { AppProviders } from "../providers/AppProviders";
import { AppNavigator } from "../navigation/AppNavigator";
import { useTheme } from "../hooks/useTheme";
import { useThemeMode } from "../hooks/useThemeMode";
import { AnimatedSplashScreen } from "../components/splash/AnimatedSplashScreen";

SplashScreen.preventAutoHideAsync().catch(() => {
  // If preventAutoHideAsync throws, we still continue to render the app.
});

// Screens that own their keyboard handling. The global KeyboardAvoidingView
// below is DISABLED while one of these is focused, so exactly one mechanism
// moves the layout at a time. The chat composer regressed five times
// (e228833 → 98d07f8 → a8c3bb5 → a12710f → 2ea5cc7) precisely because two
// layers kept fighting: a screen-level fix double-shifted against this global
// KAV, someone removed the screen-level fix, and chat broke again. If you add
// keyboard handling inside a screen, add its route name here.
const KEYBOARD_SELF_HANDLED_ROUTES = new Set(["Chat", "AdminConversation"]);

const AppShell = () => {
  const { colors } = useTheme();
  const { resolvedMode } = useThemeMode();
  const [keyboardHandledByScreen, setKeyboardHandledByScreen] = useState(false);

  useEffect(() => {
    const update = () => {
      const name = rootNavigationRef.isReady() ? rootNavigationRef.getCurrentRoute()?.name : undefined;
      setKeyboardHandledByScreen(name ? KEYBOARD_SELF_HANDLED_ROUTES.has(name) : false);
    };
    update();
    const unsubscribe = rootNavigationRef.addListener("state", update);
    return unsubscribe;
  }, []);

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={resolvedMode === "dark" ? "light" : "dark"} />
      {/* Global keyboard avoidance for screens without their own handling.
          iOS-only by design: on Android, react-native-keyboard-controller's
          provider takes over IME insets (edge-to-edge), and screens are
          expected to consume keyboard height themselves — a navigator-level
          pad here cannot reach inside react-native-screens' native views
          reliably on either platform, which is why chat handles itself. */}
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        enabled={Platform.OS === "ios" && !keyboardHandledByScreen}
      >
        <AppNavigator />
      </KeyboardAvoidingView>
    </View>
  );
};

export const AppContainer = () => {
  const [splashAnimationDone, setSplashAnimationDone] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const assetsReady = useMemo(() => fontsLoaded || Boolean(fontError), [fontError, fontsLoaded]);
  const showApp = splashAnimationDone && assetsReady;

  const handleSplashFinished = useCallback(() => {
    setSplashAnimationDone(true);
  }, []);

  return (
    <AppProviders>
      {showApp ? (
        <AppShell />
      ) : splashAnimationDone ? (
        <View style={styles.assetsLoadingFallback}>
          <ActivityIndicator color="#19B8E6" />
        </View>
      ) : (
        <AnimatedSplashScreen onFinish={handleSplashFinished} />
      )}
    </AppProviders>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  assetsLoadingFallback: {
    flex: 1,
    backgroundColor: "#F4F8FC",
    alignItems: "center",
    justifyContent: "center",
  },
});
