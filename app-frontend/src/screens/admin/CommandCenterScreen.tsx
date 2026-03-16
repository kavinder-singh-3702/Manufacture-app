import { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNotifications } from "../../providers/NotificationsProvider";
import { CommandCenterHeader, CommandCenterSubTabs } from "../../components/admin";
import { RootStackParamList } from "../../navigation/types";
import { OverviewTab } from "./components/OverviewTab";
import { TradesTab } from "./components/TradesTab";
import { AlertsTab } from "./components/AlertsTab";
import { LogsTab } from "./components/LogsTab";

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

  const handleSearchPress = () => {
    navigation.navigate("ProductSearch", {});
  };

  const handleNotificationPress = () => {
    navigation.navigate("Notifications");
  };

  return (
    <View style={styles.container}>
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
