import { useCallback, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
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
  const [showApp, setShowApp] = useState(false);

  useEffect(() => {
    // Reveal the native splash as soon as the JS bundle is ready so our custom
    // animated splash can take over.
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const handleSplashFinished = useCallback(() => {
    setShowApp(true);
  }, []);

  return (
    <AppProviders>
      {showApp ? <AppShell /> : <AnimatedSplashScreen onFinish={handleSplashFinished} />}
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
});
