import { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
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

const AppShell = () => {
  const { colors } = useTheme();
  const { resolvedMode } = useThemeMode();

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <StatusBar style={resolvedMode === "dark" ? "light" : "dark"} />
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <AppNavigator />
      </View>
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
    backgroundColor: "#05070C",
    alignItems: "center",
    justifyContent: "center",
  },
});
