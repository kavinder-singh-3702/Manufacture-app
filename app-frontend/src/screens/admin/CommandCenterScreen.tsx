import { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNotifications } from "../../providers/NotificationsProvider";
import { useThemeMode } from "../../hooks/useThemeMode";
import { CommandCenterHeader, CommandCenterSubTabs } from "../../components/admin";
import { RootStackParamList } from "../../navigation/types";
import { neuCardBg } from "../../theme/neumorphic";
import { OverviewTab } from "./components/OverviewTab";
import { TradesTab } from "./components/TradesTab";
import { AlertsTab } from "./components/AlertsTab";
import { LogsTab } from "./components/LogsTab";
import { RequestsTab } from "./components/RequestsTab";
import { MessagesTab } from "./components/MessagesTab";

const SUB_TABS = [
  { key: "overview", label: "OVERVIEW" },
  { key: "requests", label: "REQUESTS" },
  { key: "messages", label: "MESSAGES" },
  { key: "trades", label: "TRADES" },
  { key: "alerts", label: "ALERTS" },
  { key: "logs", label: "LOGS" },
];

export const CommandCenterScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { unreadCount } = useNotifications();
  // Default to 'requests' — this screen is now the admin Ops tab destination, so
  // landing on the request queue is what the admin expects.
  const [activeTab, setActiveTab] = useState("requests");
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
        {activeTab === "requests" && <RequestsTab />}
        {activeTab === "messages" && <MessagesTab />}
        {activeTab === "trades" && <TradesTab />}
        {activeTab === "alerts" && <AlertsTab />}
        {activeTab === "logs" && <LogsTab />}
      </View>
    </View>
  );
};

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
