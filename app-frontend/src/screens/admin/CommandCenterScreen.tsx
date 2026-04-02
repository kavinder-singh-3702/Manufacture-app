import { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNotifications } from "../../providers/NotificationsProvider";
import { useThemeMode } from "../../hooks/useThemeMode";
import { CommandCenterHeader, CommandCenterSubTabs } from "../../components/admin";
import { RootStackParamList } from "../../navigation/types";
import { OverviewTab } from "./components/OverviewTab";
import { TradesTab } from "./components/TradesTab";
import { AlertsTab } from "./components/AlertsTab";
import { LogsTab } from "./components/LogsTab";

/* ── Neumorphic helpers ── */
const NEU_LIGHT = "#EDF1F7";
const NEU_DARK = "#1A1F2B";
const NEU_INSET_LIGHT = "#E2E8F0";
const NEU_INSET_DARK = "#151A24";

const neuRaised = (isDark: boolean) =>
  isDark
    ? { shadowColor: "#000", shadowOffset: { width: 2, height: 3 }, shadowOpacity: 0.45, shadowRadius: 6, elevation: 4 }
    : { shadowColor: "#A3B1C6", shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 };

const neuPressed = (isDark: boolean) =>
  isDark
    ? { shadowColor: "#000", shadowOffset: { width: 1, height: 1 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 1 }
    : { shadowColor: "#A3B1C6", shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 1 };

const neuCardBg = (isDark: boolean) => (isDark ? NEU_DARK : NEU_LIGHT);
const neuInsetBg = (isDark: boolean) => (isDark ? NEU_INSET_DARK : NEU_INSET_LIGHT);

const SUB_TABS = [
  { key: "overview", label: "OVERVIEW" },
  { key: "trades", label: "TRADES" },
  { key: "alerts", label: "ALERTS" },
  { key: "logs", label: "LOGS" },
];

export const CommandCenterScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { unreadCount } = useNotifications();
  const [activeTab, setActiveTab] = useState("overview");
  const { resolvedMode } = useThemeMode();
  const isDark = resolvedMode === "dark";

  const handleSearchPress = () => {
    navigation.navigate("ProductSearch", {});
  };

  const handleNotificationPress = () => {
    navigation.navigate("Notifications");
  };

  return (
    <View style={[styles.container, { backgroundColor: neuCardBg(isDark) }]}>
      <CommandCenterHeader
        onSearchPress={handleSearchPress}
        onNotificationPress={handleNotificationPress}
        notificationCount={unreadCount}
      />
      <CommandCenterSubTabs
        tabs={SUB_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <View style={styles.content}>
        {activeTab === "overview" && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <OverviewTab />
          </ScrollView>
        )}
        {activeTab === "trades" && <TradesTab />}
        {activeTab === "alerts" && <AlertsTab />}
        {activeTab === "logs" && <LogsTab />}
      </View>
    </View>
  );
};

export { neuRaised, neuPressed, neuCardBg, neuInsetBg, NEU_LIGHT, NEU_DARK, NEU_INSET_LIGHT, NEU_INSET_DARK };

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
