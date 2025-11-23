import { View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AppProviders } from "../providers/AppProviders";
import { AppNavigator } from "../navigation/AppNavigator";
import { useTheme } from "../hooks/useTheme";

const AppShell = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppNavigator />
      </View>
    </View>
  );
};

export const AppContainer = () => {
  return (
    <AppProviders>
      <AppShell />
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
